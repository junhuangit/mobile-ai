import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// This script tests OpenAI's capability to analyze image files
// It reads a local image file, converts it to base64, and sends it to OpenAI for analysis

async function testImageAnalysis() {
  try {
    // Check if OPENAI_API_KEY is set
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Error: OPENAI_API_KEY environment variable is not set');
      process.exit(1);
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Read the test image file
    const imagePath = path.join(process.cwd(), 'public', 'test-image.png');
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error('Error: Test image file not found at', imagePath);
      process.exit(1);
    }

    // Read file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('Sending image to OpenAI for analysis...');
    
    // Send request to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'What is in this image? Provide a brief description.' 
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    // Extract and display the response
    const analysis = response.choices[0]?.message?.content || 'No response content';
    console.log('Analysis Result:');
    console.log(analysis);
    
  } catch (error) {
    console.error('Error during image analysis:', error);
  }
}

// Run the test
testImageAnalysis();