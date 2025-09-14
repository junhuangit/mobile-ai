'use client';

import { useState, useRef } from 'react';
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
      const response = await fetch(`/api/analyze?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      const newBlob = (await response.json()) as PutBlobResult;
      setBlob(newBlob);
      setStatus('Analyzing...');

      const analysisResponse = await fetch(`/api/analyze?url=${newBlob.url}`, {
        method: 'POST',
      });

      if (!analysisResponse.body) {
        throw new Error('No response body from analysis.');
      }

      // Stream the analysis
      const reader = analysisResponse.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAnalysisResult(prev => prev + chunk);
      }
      setStatus('Analysis Complete');

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