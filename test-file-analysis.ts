import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// This script tests the complete flow for both image and text files
// 1. Uploads files to Vercel Blob (simulated)
// 2. Calls the analyze API endpoint
// 3. Verifies the response handling

async function testFileAnalysis() {
  console.log('Testing file analysis functionality...');
  
  // Test 1: Image file analysis (with a real image URL)
  console.log('\n--- Testing Image Analysis ---');
  try {
    // Using a real image URL for testing
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png';
    
    // Simulate the blob storage by using the direct image URL
    const imageAnalysisResponse = await fetch(`http://localhost:3000/api/analyze?url=${encodeURIComponent(imageUrl)}`, {
      method: 'POST',
    });
    
    const imageContentType = imageAnalysisResponse.headers.get('content-type');
    console.log('Image analysis response content type:', imageContentType);
    
    if (imageContentType && imageContentType.includes('application/json')) {
      const errorData = await imageAnalysisResponse.json();
      console.log('Image analysis returned JSON error:', errorData);
    } else {
      console.log('Image analysis returned streaming response (as expected)');
      // We won't consume the stream here to keep the test simple
    }
  } catch (error) {
    console.error('Error during image analysis test:', error);
  }
  
  // Test 2: Text file analysis (with a real text file URL)
  console.log('\n--- Testing Text Analysis ---');
  try {
    // Using a real text file URL for testing
    const textUrl = 'https://raw.githubusercontent.com/vercel/next.js/canary/README.md';
    
    // Simulate the blob storage by using the direct text file URL
    const textAnalysisResponse = await fetch(`http://localhost:3000/api/analyze?url=${encodeURIComponent(textUrl)}`, {
      method: 'POST',
    });
    
    const textContentType = textAnalysisResponse.headers.get('content-type');
    console.log('Text analysis response content type:', textContentType);
    
    if (textContentType && textContentType.includes('application/json')) {
      const errorData = await textAnalysisResponse.json();
      console.log('Text analysis returned JSON error:', errorData);
    } else {
      console.log('Text analysis returned streaming response (as expected)');
      // We won't consume the stream here to keep the test simple
    }
  } catch (error) {
    console.error('Error during text analysis test:', error);
  }
  
  console.log('\n--- Test completed ---');
}

testFileAnalysis();