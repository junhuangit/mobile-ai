import OpenAI from 'openai';
import { head, del } from '@vercel/blob'; // import del

export const runtime = 'edge';

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get('url');

  if (blobUrl) {
    try {
      // Get the download URL and content type
      const { downloadUrl, contentType } = await head(blobUrl);
      
      // Check file type
      const isImage = contentType.startsWith('image/');
      const isText = contentType.startsWith('text/') || contentType.includes('text');
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      let response;
      
      if (isImage) {
        // For images, first try to send the URL directly to OpenAI
        try {
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
        } catch (openaiError) {
          // If direct URL fails, fallback to downloading and base64 conversion
          console.log('Direct URL failed, falling back to base64 conversion');
          
          // Download the file content
          const blobResponse = await fetch(downloadUrl);
          const arrayBuffer = await blobResponse.arrayBuffer();
          
          if (arrayBuffer.byteLength === 0) {
            throw new Error('Downloaded file is empty.');
          }
          
          // Convert to base64
          let binary = '';
          const bytes = new Uint8Array(arrayBuffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          
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
                      url: `data:${contentType};base64,${base64}`,                      
 //                     url: `data:image/jpg;base64,${base64}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 300,
            stream: true,
          });
        }
      } else if (isText) {
        // For text files, download content and analyze
        const blobResponse = await fetch(downloadUrl);
        const textContent = await blobResponse.text();
        
        // Truncate very large text files to avoid token limits
        const truncatedContent = textContent.length > 10000 
          ? textContent.substring(0, 10000) + "\n\n... (truncated)"
          : textContent;
        
        response = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'user',
              content: `Analyze the following text and provide a summary:

${truncatedContent}`,
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

      // Stream response to client
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

      // Schedule deletion of the blob after 3 minutes
      setTimeout(async () => {
        try {
          await del(blobUrl);
          console.log(`Blob deleted after 3 minutes: ${blobUrl}`);
        } catch (deleteError) {
          console.error(`Failed to delete blob after 3 minutes: ${blobUrl}`, deleteError);
        }
      }, 3 * 60 * 1000); // 3 minutes

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