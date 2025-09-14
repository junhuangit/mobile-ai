import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // This is a placeholder for authorization logic.
        // In a real app, you would check if the user is authenticated.
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/pdf',
          ],
          tokenPayload: JSON.stringify({
            // optional, sent to your onUploadCompleted callback
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called after the upload is completed.
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
