/**
 * Supabase Edge Function — AI Chat proxy.
 * Receives question + dashboard context, forwards to Claude API, returns streaming response.
 *
 * Deploy: supabase functions deploy chat
 * Secrets: supabase secrets set CLAUDE_API_KEY=sk-ant-...
 *
 * Local dev: supabase functions serve --env-file .env.local
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const RATE_LIMIT = 50; // per hour per user
const MODEL = 'claude-haiku-4-5-20251001';

interface ChatRequest {
  question: string;
  context: string;
  systemPrompt: string;
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://growth.sal.dev.br',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Auth: verify JWT
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  // Rate limit: count messages in last hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await supabase
    .from('chat_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo);

  if ((count || 0) >= RATE_LIMIT) {
    return new Response(JSON.stringify({ error: `Rate limit: ${RATE_LIMIT} messages/hour` }), {
      status: 429,
    });
  }

  // Parse request — systemPrompt is server-controlled, ignore client value
  const { question, context } = (await req.json()) as ChatRequest;

  if (!question?.trim()) {
    return new Response(JSON.stringify({ error: 'Question is required' }), { status: 400 });
  }

  // Server-side system prompt (never trust client)
  const systemPrompt = `You are GrowthHQ Assistant, an AI analyst for a Digital Growth Command Center.
You have access to real-time dashboard data provided in the user message context.
Answer questions about web traffic, SEO, email marketing, social media, CRM pipeline, and martech health.
Be concise and data-driven. Use specific numbers from the context. Format with markdown.`;

  if (!CLAUDE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Claude API key not configured' }), {
      status: 500,
    });
  }

  // Call Claude API with streaming
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Dashboard data:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      stream: true,
    }),
  });

  if (!claudeResponse.ok) {
    const _err = await claudeResponse.text();
    return new Response(JSON.stringify({ error: `Claude API error: ${claudeResponse.status}` }), {
      status: 502,
    });
  }

  // Stream SSE to client
  const encoder = new TextEncoder();
  let fullAnswer = '';

  const stream = new ReadableStream({
    async start(controller) {
      const reader = claudeResponse.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullAnswer += parsed.delta.text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`),
                );
              }
            } catch {
              /* skip malformed lines */
            }
          }
        }

        // Save to chat history
        await supabase.from('chat_history').insert({
          user_id: user.id,
          question,
          answer: fullAnswer,
          tokens_used: Math.ceil(fullAnswer.length / 4),
        });

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': 'https://growth.sal.dev.br',
    },
  });
});
