import fetch from 'node-fetch';

async function testApiEndpoint() {
  try {
    console.log('Testing API endpoint...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/seller/total-wallet-request-updates');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      console.log('✅ API endpoint is working correctly!');
    } else {
      console.log('❌ API endpoint returned an error status');
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error.message);
    console.log('Make sure the development server is running on port 3000');
  }
}

testApiEndpoint(); 