const http = require('http');

async function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/generate-audio',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data) });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runSecurityTests() {
  console.log("🛡️ Running Security Verification Tests...\n");

  // Test 1: Missing scriptText
  try {
    const res1 = await makeRequest({});
    console.log("Test 1 (Missing scriptText): Status", res1.status, res1.body.error === "Script text is required and must be a non-empty string" ? "✅ PASSED" : "❌ FAILED");
  } catch (e) { console.error("Test 1 Failed:", e.message); }

  // Test 2: scriptText too long
  try {
    const res2 = await makeRequest({ scriptText: "A".repeat(5001) });
    console.log("Test 2 (Long scriptText): Status", res2.status, res2.body.error === "Script text is too long (max 5000 characters)" ? "✅ PASSED" : "❌ FAILED");
  } catch (e) { console.error("Test 2 Failed:", e.message); }

  // Test 3: directorNotes too long
  try {
    const res3 = await makeRequest({ scriptText: "Hello", directorNotes: "A".repeat(1001) });
    console.log("Test 3 (Long directorNotes): Status", res3.status, res3.body.error === "Director notes are too long (max 1000 characters)" ? "✅ PASSED" : "❌ FAILED");
  } catch (e) { console.error("Test 3 Failed:", e.message); }

  // Test 4: non-string scriptText
  try {
    const res4 = await makeRequest({ scriptText: 123 });
    console.log("Test 4 (Non-string scriptText): Status", res4.status, res4.body.error === "Script text is required and must be a non-empty string" ? "✅ PASSED" : "❌ FAILED");
  } catch (e) { console.error("Test 4 Failed:", e.message); }

  console.log("\n🛡️ Security tests complete.");
}

runSecurityTests();
