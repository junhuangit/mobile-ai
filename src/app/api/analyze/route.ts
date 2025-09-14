import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get('url');

  if (blobUrl) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: 'Please return a simple greeting text.',
          },
        ],
        max_tokens: 50,
        stream: false,
      });

      const fullContent = response.choices[0]?.message?.content || 'No content returned from OpenAI.';

      return new Response(JSON.stringify({ analysis: fullContent }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });

    } catch (error) {
      console.error('Error with OpenAI analysis:', error);
      return new Response(
        JSON.stringify({
          message: `Error with OpenAI analysis (Image processing bypassed): ${
            (error as Error).message
          }`,
        }),
        {
          status: 500,
        },
      );
    }
  }

  return new Response(JSON.stringify({ message: 'Invalid request' }), {
    status: 400,
  });
}