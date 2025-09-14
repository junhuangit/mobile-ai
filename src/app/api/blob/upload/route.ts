import { handleUpload, type HandleUploadBody, generateUploadUrl } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  console.log('Received upload body:', body); // Log for debugging

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // This is a placeholder for authorization logic.
        // In a real app, you would check if the user is authenticated.
        return {
          allowedContentTypes: [
            'image/jpeg', // covers .jpg and .jpeg
            'image/png',
            'image/gif',
            'image/webp', // add webp support
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

export async function GET(request: Request): Promise<NextResponse> {
  // Generate a temporary upload URL for the frontend
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || `upload-${Date.now()}`;
  const { url, token } = await generateUploadUrl({
    pathname: filename,
    contentType: 'image/jpeg', // or let frontend specify
    expiresIn: 5 * 60, // 5 minutes, adjust as needed
  });
  return NextResponse.json({ url, token });
}
