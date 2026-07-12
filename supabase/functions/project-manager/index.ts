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

  // 1. Self-healing database permissions repair
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')
  if (dbUrl) {
    try {
      console.log("[project-manager] Attempting database permissions repair...")
      const sql = postgres(dbUrl, { ssl: 'require' })
      
      // Execute each grant statement individually to avoid prepared statement errors
      await sql`GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;`
      await sql`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;`
      await sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`
      await sql`GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;`
      await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`
      await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;`
      await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;`
      
      console.log("[project-manager] Database permissions repair completed successfully!")
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

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id, title, problem, solution, description, stage, skills_required, creator_id,
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
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
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