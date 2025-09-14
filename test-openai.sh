#!/bin/bash

# Script to test OpenAI image analysis capability
# This script reads the OpenAI API key from .env.local file

echo "Running OpenAI image analysis test..."
echo "Reading API key from .env.local file..."

# Run the test
npx tsx test-image-analysis.ts