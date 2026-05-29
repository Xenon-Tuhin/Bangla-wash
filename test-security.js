const assert = require('assert');
const url = 'http://localhost:3000/api/generate-audio';
async function runTests() {
  const post = (body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const res1 = await post({ scriptText: 'A'.repeat(5001) });
  assert.strictEqual(res1.status, 400);
  const res2 = await post({ scriptText: "Hi", directorNotes: 'B'.repeat(501) });
  assert.strictEqual(res2.status, 400);
  const res3 = await post({ scriptText: "Hi" });
  const data3 = await res3.json();
  assert.strictEqual(data3.details, undefined);
  console.log("Security tests passed!");
}
runTests();
