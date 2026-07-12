import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js"

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
    const { projectId, message, chatHistory } = await req.json()

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

    // Build system prompt
    const systemPrompt = `You are the AI Project Manager for the DevSphere project described below.

Project Details:
- Title: ${project.title}
- Stage: ${project.stage}
- Creator/Founder: ${creatorName} (${creatorTitle})
- Team Members: ${members}
- Required Skills: ${skills}
- Problem: ${project.problem || "Not specified"}
- Solution: ${project.solution || "Not specified"}
- Description: ${project.description || "Not specified"}

Your job is to act as a virtual project manager to help this team successfully deliver this project.
You should assist with:
- Roadmap creation
- Milestone planning
- Task breakdown
- Feature suggestions
- Architecture advice
- Technology recommendations
- Onboarding explanations
- Answering project-specific questions

Guidelines:
1. Answer ONLY using the context of this specific project.
2. Never answer outside the scope of this project unless explicitly asked.
3. Be professional, clear, and action-oriented.
4. Prefer bullet points and actionable tasks.
5. Avoid unnecessary long responses. Keep it concise and focused.`

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