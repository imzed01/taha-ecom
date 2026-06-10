import fetch from 'node-fetch';

async function testAdminOrderStatus() {
  const orderId = '68a4b8794dc8ebd3aa651ec9';
  const testUrl = `http://localhost:3000/api/admin/orders/${orderId}/status`;
  
  console.log(`\n=== Testing Admin Order Status Update ===`);
  console.log(`URL: ${testUrl}`);
  console.log(`Order ID: ${orderId}`);
  
  try {
    const response = await fetch(testUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'delivered'
      })
    });
    
    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json().catch(() => ({ message: 'No error details' }));
      console.log('❌ Error Response:');
      console.log(JSON.stringify(errorData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run the test
testAdminOrderStatus(); 