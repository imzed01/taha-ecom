import fetch from 'node-fetch';

async function testChatAPI() {
  try {
    console.log('🧪 Testing Chat History API');
    console.log('===========================\n');

    const sellerId = '6875764dab3c52f2d7776b35';
    const url = `http://localhost:3000/api/support-messages/history?sellerId=${sellerId}`;

    console.log(`Testing URL: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, data);

    if (Array.isArray(data)) {
      console.log(`\n✅ Success! Found ${data.length} messages`);
      
      if (data.length > 0) {
        console.log('\nSample messages:');
        data.slice(0, 3).forEach((msg, i) => {
          console.log(`${i + 1}. ${msg.senderRole} (${msg.senderId}) -> ${msg.receiverId}: "${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}"`);
        });
      }
    } else {
      console.log('❌ Response is not an array:', data);
    }

  } catch (error) {
    console.error('❌ Error testing chat API:', error);
  }
}

testChatAPI(); 