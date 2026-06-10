const testChatAPI = async () => {
  console.log('Testing Chat API...');

  // Test 1: Send a message with text
  try {
    const response1 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-seller-id',
        senderRole: 'seller',
        receiverId: 'admin',
        message: 'Test message from seller',
      }),
    });

    console.log('Test 1 - Text message:', response1.status, await response1.json());
  } catch (error) {
    console.error('Test 1 failed:', error);
  }

  // Test 2: Send a message with image placeholder
  try {
    const response2 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-seller-id',
        senderRole: 'seller',
        receiverId: 'admin',
        message: '',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      }),
    });

    console.log('Test 2 - Image message:', response2.status, await response2.json());
  } catch (error) {
    console.error('Test 2 failed:', error);
  }

  // Test 3: Test missing required fields
  try {
    const response3 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-seller-id',
        // Missing senderRole and receiverId
        message: 'Test message',
      }),
    });

    console.log('Test 3 - Missing fields:', response3.status, await response3.json());
  } catch (error) {
    console.error('Test 3 failed:', error);
  }

  // Test 4: Test invalid senderRole
  try {
    const response4 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-seller-id',
        senderRole: 'invalid-role',
        receiverId: 'admin',
        message: 'Test message',
      }),
    });

    console.log('Test 4 - Invalid senderRole:', response4.status, await response4.json());
  } catch (error) {
    console.error('Test 4 failed:', error);
  }

  // Test 5: Test empty message and no image
  try {
    const response5 = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        senderId: 'test-seller-id',
        senderRole: 'seller',
        receiverId: 'admin',
        message: '',
        // No image
      }),
    });

    console.log('Test 5 - Empty message and no image:', response5.status, await response5.json());
  } catch (error) {
    console.error('Test 5 failed:', error);
  }

  console.log('Chat API tests completed!');
};

// Run the tests
testChatAPI(); 