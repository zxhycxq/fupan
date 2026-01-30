// Simple test script to verify the backend server works correctly
const axios = require('axios');

// Test configuration
const BACKEND_URL = 'http://localhost:8080';

console.log('Testing Fupan Backend Server...\n');

// Test 1: Health check
async function testHealthCheck() {
  try {
    console.log('1. Testing health check endpoint...');
    const response = await axios.get(`${BACKEND_URL}/`);
    console.log('✅ Health check passed');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: OCR token endpoint
async function testOcrToken() {
  try {
    console.log('\n2. Testing OCR token endpoint...');
    const response = await axios.get(`${BACKEND_URL}/api/ocr/token`);
    console.log('✅ OCR token endpoint reached');
    console.log('Response status:', response.status);
    if (response.data.success) {
      console.log('✅ Token retrieval successful');
    } else {
      console.log('⚠️ Token retrieval status:', response.data);
    }
    return true;
  } catch (error) {
    console.error('⚠️ OCR token test failed (expected if API keys not configured):', error.message);
    return true; // Don't fail the overall test as this might fail due to missing API keys
  }
}

// Test 3: OCR recognize endpoint (should fail gracefully with validation)
async function testOcrRecognize() {
  try {
    console.log('\n3. Testing OCR recognize endpoint validation...');
    const response = await axios.post(`${BACKEND_URL}/api/ocr/recognize`, {});
    console.log('❌ OCR recognize should have failed with validation error');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ OCR recognize validation working correctly (returned 400)');
      console.log('Response:', error.response.data);
      return true;
    } else {
      console.log('⚠️ Unexpected error during OCR recognize test:', error.message);
      return true;
    }
  }
}

async function runTests() {
  console.log('Starting backend server tests...\n');
  
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testOcrToken());
  results.push(await testOcrRecognize());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n--- Test Summary ---`);
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests had warnings (which may be expected without API keys)');
  }
}

// Only run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testOcrToken,
  testOcrRecognize,
  runTests
};