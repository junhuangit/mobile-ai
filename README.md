This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# mobile-ai

## Features

- Upload files (images, text, PDF) via backend API.
- Supported image types: JPEG (.jpg, .jpeg), PNG, GIF, WEBP.
- Analyze uploaded files using OpenAI GPT-4 Turbo (vision and text).
- Analysis results streamed to frontend for real-time display.
- Uploaded blobs are automatically deleted 3 minutes after analysis.

## Usage

1. **File Upload:**  
   Upload files via the `/api/blob/upload` endpoint. Only supported content types are accepted.

2. **File Analysis:**  
   Analyze files by sending a request to `/api/analyze?url=<blobUrl>`. The backend streams the analysis result from OpenAI to the frontend.

3. **Blob Deletion:**  
   After analysis, the backend schedules deletion of the uploaded blob 3 minutes later.

## Limitations

### Vercel Blob Temporary Upload URLs

Vercel Blob does **not** support generating temporary pre-signed upload URLs for direct client uploads.  
All uploads must go through the backend API route using the `handleUpload` function.

**Implications:**
- You cannot generate a unique temporary upload URL for each client request.
- Multi-client use cases requiring direct, secure uploads from the client to storage are not supported.
- All file uploads must be handled via the backend, which manages authorization and validation.

Refer to the [Vercel Blob documentation](https://vercel.com/docs/storage/vercel-blob) for current capabilities and updates.

## Supported File Types

- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Text: `text/plain`
- PDF: `application/pdf`

## Backend Flow

1. **Upload:**  
   - Client uploads file via `/api/blob/upload`.
   - Backend validates content type and stores the blob.

2. **Analyze:**  
   - Client requests analysis via `/api/analyze?url=<blobUrl>`.
   - Backend streams OpenAI analysis result to client.
   - Blob is scheduled for deletion 3 minutes after analysis.

## Notes

- For production, consider using a persistent job runner for blob deletion if strict timing is required.
- The backend uses OpenAI's streaming API for real-time analysis results.
