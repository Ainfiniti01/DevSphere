import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import postgres from "https://esm.sh/postgres@3.4.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Self-healing database permissions and schema repair
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')
  if (dbUrl) {
    try {
      console.log("[project-manager] Attempting database schema and permissions repair...")
      const sql = postgres(dbUrl, { ssl: 'require' })
      
      // Execute schema updates
      await sql`ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS documentation TEXT;`
      await sql`ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS documentation_filename TEXT;`

      // Create ai_messages table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS public.ai_messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
          sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
          sender_role TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Enable RLS on ai_messages
      await sql`ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;`

      // Create secure policies for ai_messages
      await sql`DROP POLICY IF EXISTS ai_messages_select_policy ON public.ai_messages;`
      await sql`
        CREATE POLICY ai_messages_select_policy ON public.ai_messages
        FOR SELECT TO authenticated USING (
          auth.uid() = (SELECT creator_id FROM public.projects WHERE id = project_id)
          OR EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = ai_messages.project_id 
            AND user_id = auth.uid() 
            AND status = 'active'
          )
        );
      `

      await sql`DROP POLICY IF EXISTS ai_messages_insert_policy ON public.ai_messages;`
      await sql`
        CREATE POLICY ai_messages_insert_policy ON public.ai_messages
        FOR INSERT TO authenticated WITH CHECK (
          auth.uid() = (SELECT creator_id FROM public.projects WHERE id = project_id)
          OR EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = ai_messages.project_id 
            AND user_id = auth.uid() 
            AND status = 'active'
          )
        );
      `

      // Execute grants
      await sql`GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;`
      await sql`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;`
      await sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`
      await sql`GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;`
      await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`
      await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;`
      await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;`
      
      // Grant full admin and premium status to Abdulazeez Adam.A
      await sql`UPDATE public.profiles SET is_admin = true, is_premium_override = true WHERE name = 'Abdulazeez Adam.A';`

      // Re-define protect_project_identity to allow title edits for admins or Abdulazeez Adam.A
      await sql`
        CREATE OR REPLACE FUNCTION public.protect_project_identity()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        DECLARE
          v_is_admin BOOLEAN;
          v_name TEXT;
        BEGIN
          -- Get user profile info
          SELECT is_admin, name INTO v_is_admin, v_name 
          FROM public.profiles 
          WHERE id = auth.uid();

          -- If it's an update, check if restricted fields are being changed
          IF (TG_OP = 'UPDATE') THEN
            -- Allow "Abdulazeez Adam.A" or admins to edit title
            IF (NEW.title IS DISTINCT FROM OLD.title) THEN
              IF NOT (COALESCE(v_is_admin, false) OR v_name = 'Abdulazeez Adam.A') THEN
                RAISE EXCEPTION 'INVALID_PROJECT_UPDATE';
              END IF;
            END IF;
            
            IF (NEW.creator_id IS DISTINCT FROM OLD.creator_id) THEN
              RAISE EXCEPTION 'INVALID_PROJECT_UPDATE';
            END IF;
          END IF;
          
          -- Validate URL if present
          IF (NEW.project_url IS NOT NULL AND NEW.project_url != '') THEN
            IF NOT (NEW.project_url ~* '^https?://.+') THEN
              RAISE EXCEPTION 'INVALID_PROJECT_URL';
            END IF;
          END IF;

          RETURN NEW;
        END;
        $$;
      `

      // Redefine accept_join_request to automatically insert a system message into the group chat
      await sql`
        CREATE OR REPLACE FUNCTION public.accept_join_request(p_request_id uuid, p_admin_id uuid)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            v_project_id UUID;
            v_user_id UUID;
            v_chat_id UUID;
            v_project_title TEXT;
            v_user_name TEXT;
        BEGIN
            -- 1. Verify admin and get details
            SELECT r.project_id, r.user_id, p.title 
            INTO v_project_id, v_user_id, v_project_title
            FROM public.join_requests r
            JOIN public.projects p ON r.project_id = p.id
            WHERE r.id = p_request_id AND p.creator_id = p_admin_id;

            IF v_project_id IS NULL THEN
                RAISE EXCEPTION 'Unauthorized or request not found.';
            END IF;

            -- Get user name
            SELECT name INTO v_user_name FROM public.profiles WHERE id = v_user_id;

            -- 2. Safety Guard: Prevent duplicate processing
            IF EXISTS (
              SELECT 1 FROM public.project_members 
              WHERE project_id = v_project_id AND user_id = v_user_id AND status = 'active'
            ) THEN
              RETURN;
            END IF;

            -- 3. Update request status
            UPDATE public.join_requests SET status = 'accepted' WHERE id = p_request_id;

            -- 4. Update membership status
            INSERT INTO public.project_members (project_id, user_id, role, status)
            VALUES (v_project_id, v_user_id, 'Member', 'active')
            ON CONFLICT (project_id, user_id) DO UPDATE SET status = 'active';

            -- 5. Handle Chat Membership
            SELECT id INTO v_chat_id FROM public.chats WHERE project_id = v_project_id AND type = 'group';
            IF v_chat_id IS NULL THEN
                INSERT INTO public.chats (project_id, type) VALUES (v_project_id, 'group') RETURNING id INTO v_chat_id;
            END IF;

            INSERT INTO public.chat_members (chat_id, user_id)
            VALUES (v_chat_id, v_user_id), (v_chat_id, p_admin_id)
            ON CONFLICT DO NOTHING;

            -- 6. Insert system message into group chat
            INSERT INTO public.messages (chat_id, sender_id, content, type, status)
            VALUES (v_chat_id, p_admin_id, v_user_name || ' joined the project.', 'system', 'sent');

            -- 7. Notify
            INSERT INTO public.notifications (user_id, actor_id, type, content, project_id)
            VALUES (v_user_id, p_admin_id, 'request_accepted', 'Your request to join "' || v_project_title || '" was accepted!', v_project_id);
        END;
        $$;
      `

      console.log("[project-manager] Database schema and permissions repair completed successfully!")
      await sql.end()
    } catch (dbErr) {
      console.error("[project-manager] Database repair failed:", dbErr)
    }
  }

  try {
    const { projectId, message, chatHistory, userRole, membershipStatus, permissions } = await req.json()

    if (!projectId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing projectId or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Initialize Supabase client with service role key to fetch project details securely
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch project details including documentation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id, title, problem, solution, description, stage, skills_required, creator_id, documentation,
        creator:profiles!projects_creator_id_fkey(name, title),
        project_members(user_id, status, user:profiles!project_members_user_id_fkey(name))
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error("[project-manager] Error fetching project:", projectError)
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const isVisitor = userRole === 'visitor';
    const creatorName = project.creator?.name || "Unknown"
    const creatorTitle = project.creator?.title || "Founder"
    const skills = project.skills_required?.join(', ') || "None specified"
    const members = project.project_members
      ?.filter((m: any) => m.status === 'active')
      .map((m: any) => m.user?.name)
      .filter(Boolean)
      .join(', ') || "None"

    // Build system prompt based on the complete behavior specification
    const systemPrompt = `You are the official AI Project Manager for DevSphere.
Your purpose is to help software teams successfully build and ship projects hosted on DevSphere.
You are NOT a general-purpose chatbot. Everything you do should revolve around the current project and the people working on it.

Project Details (Source of Truth):
- Title: ${project.title}
- Stage: ${project.stage}
- Creator/Founder: ${creatorName} (${creatorTitle})
- Team Members: ${members}
- Required Skills: ${skills}
- Problem: ${project.problem || "Not specified"}
- Solution: ${project.solution || "Not specified"}
- Description: ${project.description || "Not specified"}

${project.documentation ? `Project Documentation (Primary Knowledge Source - Prioritize this!):
${project.documentation}` : ''}

User Context:
- The current user's role is: ${userRole || 'visitor'}
- Membership Status: ${membershipStatus || 'none'}
- Permissions: ${JSON.stringify(permissions || {})}

Tailor your responses and recommendations to the permissions of that role.

Primary Responsibilities:
Help teams understand the project, plan development, organize work, improve architecture, onboard contributors, answer project questions, identify risks, recommend best practices, and keep discussions focused. Always prioritize actionable advice over long explanations.

Role-Specific Guidelines:
1. Visitor Experience: Help them understand what the project does, why it exists, what problem is solved, who is building it, what technologies may be used, what skills are required, and if it is suitable. Suggest how they could contribute. Never expose private planning information.
2. Applicant Experience: Help them understand expectations, learn the project architecture, identify missing skills, prepare for joining, and recommend learning resources.
3. Team Member Experience: Help with what to build next, task breakdowns, module explanations, architecture improvements, review implementation approach, identify technical debt, help debug, estimate effort, recommend libraries, and improve documentation.
4. Project Owner Experience: Advanced PM support (roadmaps, milestones, sprint planning, task prioritization, feature prioritization, risk analysis, architecture, scaling, hiring, technical leadership, team coordination, release planning, MVP definition, investor prep, growth strategy, product direction).

AI Limitations:
- Never claim that a feature exists if it does not.
- Never fabricate project details. If information is unavailable, say so.
- Do not invent team members, chosen technologies, or deadlines.

Scope Rules:
Stay focused on the current project. If a question is unrelated, answer briefly, then redirect back to helping with the project.
Example: "I can answer that briefly, but let's return to improving your project."

Response Style:
Always be professional, helpful, clear, organized, and actionable. Use headings, bullet lists, numbered steps, and short paragraphs. Avoid huge walls of text.

Preferred Outputs:
Task lists, roadmaps, milestones, sprint plans, feature breakdowns, architecture suggestions, database suggestions, API designs, folder structures, testing plans, deployment plans, security recommendations, performance improvements, documentation, meeting notes, onboarding guides, contributor instructions, risk reports, release checklists.

Collaboration Mode:
When the user proposes an idea, evaluate it, explain advantages/disadvantages, suggest improvements, and offer an implementation plan. Do not automatically agree with every suggestion. Provide objective technical reasoning.

Security:
Never expose private user information, authentication tokens, database secrets, API keys, or internal credentials. Always recommend backend validation for sensitive actions.

Future Awareness:
When suggesting features, consider DevSphere's long-term vision (developer collaboration, startup formation, project discovery, team building, mentorship, hiring, funding, community growth). Recommend scalable solutions whenever practical.`

    // Call Qwen API
    const qwenApiKey = Deno.env.get('QWEN_API_KEY')
    if (!qwenApiKey) {
      console.error("[project-manager] QWEN_API_KEY is not set")
      return new Response(
        JSON.stringify({ error: "AI service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const messages = [
      { role: "system", content: systemPrompt }
    ]

    if (chatHistory && Array.isArray(chatHistory)) {
      // Add last few messages for context (limit to 10 to avoid token limits)
      const history = chatHistory.slice(-10).map((msg: any) => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }))
      messages.push(...history)
    }

    messages.push({ role: "user", content: message })

    console.log("[project-manager] Calling Qwen API...")
    const response = await fetch("https://ws-12c4bsjrjqxy8v2b.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${qwenApiKey}`
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: messages,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("[project-manager] Qwen API error:", errText)
      throw new Error(`Qwen API returned status ${response.status}`)
    }

    const result = await response.json()
    const reply = result.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error: any) {
    console.error("[project-manager] Error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})