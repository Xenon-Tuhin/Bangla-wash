const assert = require('assert');

const url = 'http://localhost:3000/api/generate-audio';

async function runTests() {
  console.log("Running security verification tests...");

  // Test 1: scriptText missing
  console.log("Testing missing scriptText...");
  const res1 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(res1.status, 400);
  const data1 = await res1.json();
  assert.strictEqual(data1.error, "Script text is required and must be a string");

  // Test 2: scriptText too long
  console.log("Testing scriptText too long...");
  const res2 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptText: 'a'.repeat(5001) })
  });
  assert.strictEqual(res2.status, 400);
  const data2 = await res2.json();
  assert.strictEqual(data2.error, "Script text is too long (max 5000 characters)");

  // Test 3: directorNotes too long
  console.log("Testing directorNotes too long...");
  const res3 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptText: 'test', directorNotes: 'a'.repeat(501) })
  });
  assert.strictEqual(res3.status, 400);
  const data3 = await res3.json();
  assert.strictEqual(data3.error, "Director notes must be a string and max 500 characters");

  // Test 4: Internal error sanitization (requires server to have no API key)
  console.log("Testing error sanitization...");
  const res4 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptText: 'test' })
  });
  // Since GEMINI_API_KEY is not set, it returns 500
  assert.strictEqual(res4.status, 500);
  const data4 = await res4.json();
  assert.strictEqual(data4.error, "Internal server error");
  assert.strictEqual(data4.details, undefined);

  console.log("All security verification tests passed!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
