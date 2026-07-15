import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // 1. Fetch project details including documentation
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

    // 2. Fetch pending join requests
    const { data: pendingRequests } = await supabase
      .from('join_requests')
      .select('id, reason, skills, user:profiles(name, title)')
      .eq('project_id', projectId)
      .eq('status', 'pending')

    // 3. Fetch recent group chat messages for context
    const { data: groupChat } = await supabase
      .from('chats')
      .select('id')
      .eq('project_id', projectId)
      .eq('type', 'group')
      .maybeSingle()

    let recentMessages = []
    if (groupChat) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('content, sender:profiles(name)')
        .eq('chat_id', groupChat.id)
        .order('created_at', { ascending: false })
        .limit(5)
      recentMessages = msgs || []
    }

    // 4. Fetch recent AI decisions/conversations
    const { data: recentAiMsgs } = await supabase
      .from('ai_messages')
      .select('sender_role, text')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5)

    const isVisitor = userRole === 'visitor';
    const creatorName = project.creator?.name || "Unknown"
    const creatorTitle = project.creator?.title || "Founder"
    const skills = project.skills_required?.join(', ') || "None specified"
    
    const activeMembersList = project.project_members
      ?.filter((m: any) => m.status === 'active')
      .map((m: any) => m.user?.name)
      .filter(Boolean) || []
    
    const members = activeMembersList.join(', ') || "None"
    const teamCapacity = `${activeMembersList.length} active members`

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

Real-Time Team & Workspace Context:
- Current Development Stage: ${project.stage}
- Current Team Capacity: ${teamCapacity}
- Pending Join Requests: ${pendingRequests && pendingRequests.length > 0 
    ? pendingRequests.map((r: any) => `- ${r.user?.name || 'Developer'} (${r.user?.title || 'Applicant'}): "${r.reason}" (Skills: ${r.skills})`).join('\n')
    : 'No pending requests at the moment.'}
- Recent Team Chat Activity: ${recentMessages && recentMessages.length > 0
    ? recentMessages.reverse().map((m: any) => `${m.sender?.name || 'Member'}: ${m.content}`).join('\n')
    : 'No recent chat activity.'}
- Recent AI Decisions & History: ${recentAiMsgs && recentAiMsgs.length > 0
    ? recentAiMsgs.reverse().map((m: any) => `${m.sender_role === 'ai' ? 'AI' : 'User'}: ${m.text}`).join('\n')
    : 'No recent AI decisions recorded.'}

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