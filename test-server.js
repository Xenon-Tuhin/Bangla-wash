const fs = require('fs');
const path = require('path');

const url = 'http://localhost:3000/api/generate-audio';

const testPayload = {
  scriptText: "Xenon: (excited) [সবকিছু ঠিকঠাক কাজ করছে!] Silica: (giggling) [ওয়াও! এটা অসাধারণ!]",
  directorNotes: "Style: Sassy GenZ beauty YouTuber. Pacing: fast, energetic.",
  xenonVoice: "Puck",
  silicaVoice: "Aoede"
};

async function testServer() {
  console.log("Sending test request to local Express server...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Server returned an error status:", res.status);
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    if (data.audioUrl && data.audioUrl.startsWith('data:audio/wav;base64,')) {
      console.log("Success! Server returned a valid WAV Base64 data URL.");
      
      const base64Data = data.audioUrl.replace('data:audio/wav;base64,', '');
      const wavBuffer = Buffer.from(base64Data, 'base64');
      
      const outputDir = path.join(__dirname, 'scratch');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'test-server-output.wav');
      fs.writeFileSync(outputPath, wavBuffer);
      
      console.log(`Successfully verified and saved audio to: ${outputPath}`);
      console.log(`Audio file size: ${wavBuffer.length} bytes`);
    } else {
      console.error("Server response format invalid:", data);
      process.exit(1);
    }
  } catch (err) {
    console.error("Fetch request to local server failed:", err);
    process.exit(1);
  }
}

testServer();
