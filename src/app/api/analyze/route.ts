import OpenAI from 'openai';
import { head } from '@vercel/blob';

export const runtime = 'edge';

// Helper function to determine content type from URL or response
async function getContentType(url: string, isVercelBlob: boolean): Promise<{ contentType: string; downloadUrl: string }> {
  if (isVercelBlob) {
    // For Vercel Blob URLs, use the head function
    try {
      const { downloadUrl, contentType } = await head(url);
      return { downloadUrl, contentType };
    } catch (error) {
      // If head fails, try to determine from URL
      throw new Error(`Vercel Blob error: ${(error as Error).message}`);
    }
  } else {
    // For external URLs, make a HEAD request to get content type
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      const contentType = headResponse.headers.get('content-type') || 'application/octet-stream';
      return { downloadUrl: url, contentType };
    } catch (error) {
      // If HEAD request fails, make a GET request to determine content type
      const getResponse = await fetch(url);
      const contentType = getResponse.headers.get('content-type') || 'application/octet-stream';
      return { downloadUrl: url, contentType };
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get('url');

  if (blobUrl) {
    try {
      // Check if this is a Vercel Blob URL
      const isVercelBlob = blobUrl.includes('vercel-storage.com') || blobUrl.includes('vercel.app');
      
      // Get content type and download URL
      const { downloadUrl, contentType } = await getContentType(blobUrl, isVercelBlob);
      
      // Check file type
      const isImage = contentType.startsWith('image/');
      const isText = contentType.startsWith('text/') || contentType.includes('text');
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      let response;
      
      if (isImage) {
        // For images, use the image analysis capability
        response = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this image and provide a summary.' },
                {
                  type: 'image_url',
                  image_url: {
                    url: downloadUrl, // Use the direct download URL
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
          stream: true,
        });
      } else if (isText) {
        // For text files, download content and analyze
        const blobResponse = await fetch(downloadUrl);
        const textContent = await blobResponse.text();
        
        // Truncate very large text files to avoid token limits
        const truncatedContent = textContent.length > 10000 
          ? textContent.substring(0, 10000) + '\n\n... (truncated)'
          : textContent;
        
        response = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'user',
              content: `Analyze the following text and provide a summary:\n\n${truncatedContent}`,
            },
          ],
          max_tokens: 300,
          stream: true,
        });
      } else {
        // For other file types, return an error
        return new Response(
          JSON.stringify({
            message: `File type ${contentType} is not supported for analysis. Supported types: images and text files.`,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

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
        JSON.stringify({
          message: `Error with OpenAI analysis: ${(error as Error).message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  return new Response(JSON.stringify({ message: 'Invalid request' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}