// Test the updated implementation with a real image
import OpenAI from 'openai';
import fs from 'fs';

async function testUpdatedImplementation() {
  console.log('Testing updated implementation...');
  
  try {
    // Test the analyze endpoint with a sample blob URL
    // We'll use the same image URL from our previous test
    const testBlobUrl = 'https://o6h2j75pvhedxa8x.public.blob.vercel-storage.com/test-image.png';
    
    const testResponse = await fetch(`http://localhost:3000/api/analyze?url=${encodeURIComponent(testBlobUrl)}`, {
      method: 'POST',
    });
    
    const contentType = testResponse.headers.get('content-type');
    console.log('Analyze endpoint response content type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await testResponse.json();
      console.log('Analyze endpoint returned JSON error:', errorData);
    } else {
      console.log('Analyze endpoint returned streaming response (as expected)');
      // Try to read a small part of the stream to verify it works
      if (testResponse.body) {
        const reader = testResponse.body.getReader();
        const decoder = new TextDecoder();
        
        // Read just the first chunk to verify streaming works
        const { done, value } = await reader.read();
        if (!done && value) {
          const chunk = decoder.decode(value, { stream: true });
          console.log('First chunk of analysis:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
        }
        reader.releaseLock();
      }
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testUpdatedImplementation();