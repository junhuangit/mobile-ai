'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import type { PutBlobResult } from '@vercel/blob';

export default function HomePage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [status, setStatus] = useState('Welcome');
  const [analysisResult, setAnalysisResult] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalysisResult('');
    setStatus('Uploading...');

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
      });

      setBlob(newBlob);
      setStatus('Analyzing...');

      const analysisResponse = await fetch(`/api/analyze?url=${newBlob.url}`, {
        method: 'POST',
      });

      const analysisData = await analysisResponse.json();
      if (analysisData.analysis) {
        setAnalysisResult(analysisData.analysis);
        setStatus('Analysis Complete');
      } else if (analysisData.message) {
        setAnalysisResult(analysisData.message);
        setStatus('Analysis Error');
      } else {
        setAnalysisResult('Unexpected response from analysis API.');
        setStatus('Analysis Error');
      }

    } catch (error) {
      console.error('An error occurred:', error);
      setStatus(`Error: ${(error as Error).message}`)
    }
  };

  return (
    <main className="main-container">
      <div className="content-wrapper">
        <div className="api-key-warning">
          <p><strong>Action Required:</strong> Before this works, you must add your OpenAI API Key and Vercel Blob Token to your Vercel project&apos;s environment variables. Name them `OPENAI_API_KEY` and `BLOB_READ_WRITE_TOKEN`.</p>
        </div>

        <h1 className="title">AI File Analysis</h1>
        <p className="description">Upload a large file for analysis by OpenAI.</p>

        <input 
          type="file" 
          ref={inputFileRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />

        <button 
          className="upload-button" 
          onClick={() => inputFileRef.current?.click()}
        >
          Select and Analyze File
        </button>

        <div className="status-card">
          <p><strong>Status:</strong> {status}</p>
        </div>

        {analysisResult && (
          <div className="results-card">
            <h2 className="results-title">Analysis Results</h2>
            <p className="results-text">{analysisResult}</p>
          </div>
        )}

        {blob && (
          <div className="blob-url-card">
            <p>File uploaded to: <a href={blob.url} target="_blank" rel="noopener noreferrer">{blob.pathname}</a></p>
          </div>
        )}
      </div>
    </main>
  );
}