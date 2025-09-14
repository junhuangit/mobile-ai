import OpenAI from 'openai';
import { head } from '@vercel/blob';

export const runtime = 'edge';

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get('url');

  if (blobUrl) {
    try {
      const { downloadUrl, contentType } = await head(blobUrl);
      const blobResponse = await fetch(downloadUrl);
      const arrayBuffer = await blobResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this file and provide a summary.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${contentType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        stream: true,
      });

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(content);
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });

    } catch (error) {
      console.error('Error with OpenAI analysis:', error);
      return new Response(
        JSON.stringify({ message: `Error with OpenAI analysis: ${(error as Error).message}` }),
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