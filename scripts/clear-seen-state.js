// Script to clear localStorage seen state for testing
console.log('Clearing localStorage seen state...');

// Clear all admin-seen-sellers entries
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('admin-seen-sellers-')) {
    localStorage.removeItem(key);
    console.log(`Cleared: ${key}`);
  }
}

console.log('LocalStorage seen state cleared!');
console.log('You can now refresh the page to test the badge behavior from scratch.'); 