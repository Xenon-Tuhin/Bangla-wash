const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/generate-audio',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(data)
        });
      });
    });
    req.on('error', (e) => { reject(e); });
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runTests() {
  console.log("--- Running Security Tests ---");

  // Test 1: Empty scriptText
  try {
    const res1 = await makeRequest({ scriptText: "" });
    console.log("Test 1 (Empty script):", res1.statusCode === 400 && res1.body.error === "Valid script text is required" ? "PASSED" : "FAILED", res1.statusCode, res1.body);
  } catch (e) { console.log("Test 1 FAILED:", e.message); }

  // Test 2: scriptText too long
  try {
    const res2 = await makeRequest({ scriptText: "a".repeat(5001) });
    console.log("Test 2 (Long script):", res2.statusCode === 400 && res2.body.error === "Script text is too long (max 5000 characters)" ? "PASSED" : "FAILED", res2.statusCode, res2.body);
  } catch (e) { console.log("Test 2 FAILED:", e.message); }

  // Test 3: directorNotes too long
  try {
    const res3 = await makeRequest({ scriptText: "Hello", directorNotes: "a".repeat(1001) });
    console.log("Test 3 (Long notes):", res3.statusCode === 400 && res3.body.error === "Director notes are too long (max 1000 characters)" ? "PASSED" : "FAILED", res3.statusCode, res3.body);
  } catch (e) { console.log("Test 3 FAILED:", e.message); }

  // Test 4: Payload too large (express limit)
  try {
    const largePayload = { scriptText: "a".repeat(1024 * 101) }; // > 100kb
    const req = http.request(options, (res) => {
      console.log("Test 4 (Payload > 100kb):", res.statusCode === 413 ? "PASSED" : "FAILED", res.statusCode);
    });
    req.on('error', (e) => { console.log("Test 4 Error (expected if server closes connection):", e.message); });
    req.write(JSON.stringify(largePayload));
    req.end();
  } catch (e) { console.log("Test 4 FAILED:", e.message); }
}

runTests();
