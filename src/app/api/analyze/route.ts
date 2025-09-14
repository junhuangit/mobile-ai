import OpenAI from 'openai';
import { head } from '@vercel/blob';

export const runtime = 'edge';

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get('url');

  if (blobUrl) {
    try {
      // Commented out image processing code for testing OpenAI API connectivity
      // const { downloadUrl, contentType } = await head(blobUrl);
      // const blobResponse = await fetch(downloadUrl);
      // const arrayBuffer = await blobResponse.arrayBuffer();

      // if (arrayBuffer.byteLength === 0) {
      //   throw new Error('Downloaded image file is empty.');
      // }

      // const base64 = Buffer.from(arrayBuffer).toString('base64');

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
      // const { contentType } = await head(blobUrl); // Commented out as image processing is bypassed
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