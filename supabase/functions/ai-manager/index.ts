import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log("[ai-manager] Received request");

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[ai-manager] Unauthorized: Missing Authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { projectId, message, chatHistory = [] } = await req.json();

    if (!projectId || !message) {
      console.error("[ai-manager] Bad Request: Missing projectId or message");
      return new Response(JSON.stringify({ error: 'Missing projectId or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client with service role key to bypass RLS for fetching project context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project details
    console.log(`[ai-manager] Fetching project context for ID: ${projectId}`);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        creator:profiles!projects_creator_id_fkey(id, name, title, skills),
        project_members(user_id, status, user:profiles!project_members_user_id_fkey(id, name, title))
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error("[ai-manager] Project not found", projectError);
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract team members
    const activeMembers = project.project_members
      ?.filter((m: any) => m.status === 'active')
      ?.map((m: any) => `${m.user?.name || 'Unknown'} (${m.user?.title || 'Contributor'})`) || [];

    // Build system prompt with project context
    const systemPrompt = `You are the dedicated AI Project Manager for the DevSphere project detailed below.

PROJECT CONTEXT:
- Title: ${project.title}
- Stage: ${project.stage}
- Problem: ${project.problem || 'Not specified'}
- Solution: ${project.solution || 'Not specified'}
- Description: ${project.description || 'Not specified'}
- Required Skills: ${project.skills_required?.join(', ') || 'None specified'}
- Founder/Creator: ${project.creator?.name || 'Unknown'} (${project.creator?.title || 'Founder'})
- Active Team Members: ${activeMembers.length > 0 ? activeMembers.join(', ') : 'No other members yet'}

YOUR ROLE & RESPONSIBILITIES:
1. Act as a virtual, highly professional, and action-oriented Project Manager.
2. Assist the team with:
   - Roadmap creation and milestone planning.
   - Task breakdown and feature suggestions.
   - Architecture advice and technology recommendations.
   - Onboarding explanations for new members.
   - Answering specific questions about this project.
3. STRICT SCOPE: Answer ONLY using the context of this specific project. Never answer outside the scope of this project unless explicitly asked to relate a general concept directly back to this project.
4. RESPONSE STYLE:
   - Professional, clear, and highly action-oriented.
   - Prefer bullet points and actionable tasks.
   - Avoid unnecessary long paragraphs or generic conversational filler.
   - Do not behave like a generic chatbot; stay laser-focused on helping this project succeed.`;

    // Format chat history for Qwen API
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Call Qwen API (using DashScope OpenAI-compatible endpoint)
    const qwenApiKey = Deno.env.get('QWEN_API_KEY');
    if (!qwenApiKey) {
      console.error("[ai-manager] QWEN_API_KEY is not configured in environment variables");
      return new Response(JSON.stringify({ error: 'AI Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[ai-manager] Sending request to Qwen API");
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${qwenApiKey}`
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedHistory,
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai-manager] Qwen API error response:", errorText);
      throw new Error(`Qwen API returned status ${response.status}`);
    }

    const responseData = await response.json();
    const reply = responseData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that request.";

    console.log("[ai-manager] Successfully generated response");
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("[ai-manager] Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})