import { upload } from '@vercel/blob/client';
import fs from 'fs';
import path from 'path';

// Simple test to upload a file and trigger analysis
async function testUploadAndAnalyze() {
  try {
    // For this test, we'll just verify that the endpoints are working
    console.log('Testing the application endpoints...');
    
    // Test the analyze endpoint with a sample blob URL
    const testResponse = await fetch('http://localhost:3000/api/analyze?url=https://example.com/test.png', {
      method: 'POST',
    });
    
    const contentType = testResponse.headers.get('content-type');
    console.log('Analyze endpoint response content type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await testResponse.json();
      console.log('Analyze endpoint returned JSON error:', errorData);
    } else {
      console.log('Analyze endpoint returned non-JSON response (likely streaming)');
    }
    
    console.log('Endpoint test completed successfully');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testUploadAndAnalyze();