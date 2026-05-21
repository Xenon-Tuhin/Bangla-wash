const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("API Key not found in environment variables!");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

// Attempt 1 payload
const payload1 = {
  contents: [
    {
      parts: [
        {
          text: "Xenon: [laughs] হ্যালো কেমন আছেন? Silica: [giggles] আমি ভালো আছি, আপনি?"
        }
      ]
    }
  ],
  generationConfig: {
    responseModalities: ["AUDIO"],
    speechConfig: {
      multiSpeakerVoiceConfig: {
        voiceConfigs: [
          {
            speaker: "Xenon",
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Fenrir"
              }
            }
          },
          {
            speaker: "Silica",
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Leda"
              }
            }
          }
        ]
      }
    }
  }
};

async function runTest() {
  console.log("Sending request to Gemini 3.1 Flash TTS Preview endpoint...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload1)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("API Error Response Status:", res.status);
      console.error(JSON.stringify(data, null, 2));

      // Check if schema validation error suggests "speakerVoiceConfigs" or other properties
      if (JSON.stringify(data).includes("INVALID_ARGUMENT") || res.status === 400) {
        console.log("\nAttempting alternative key: 'speakerVoiceConfigs' instead of 'voiceConfigs'...");
        const payload2 = JSON.parse(JSON.stringify(payload1));
        const vcs = payload2.generationConfig.speechConfig.multiSpeakerVoiceConfig.voiceConfigs;
        delete payload2.generationConfig.speechConfig.multiSpeakerVoiceConfig.voiceConfigs;
        payload2.generationConfig.speechConfig.multiSpeakerVoiceConfig.speakerVoiceConfigs = vcs;

        const res2 = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload2)
        });

        const data2 = await res2.json();
        if (!res2.ok) {
          console.error("Alternative attempt failed as well:", res2.status);
          console.error(JSON.stringify(data2, null, 2));
        } else {
          console.log("Success with 'speakerVoiceConfigs'!");
          parseAndSave(data2);
        }
      }
    } else {
      console.log("Success with 'voiceConfigs'!");
      parseAndSave(data);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

function parseAndSave(data) {
  try {
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    
    if (part?.inlineData?.data) {
      console.log("Successfully generated audio!");
      console.log("Mime Type:", part.inlineData.mimeType);
      
      const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
      console.log("Audio Buffer size in bytes:", audioBuffer.length);
      
      // Save raw data to a file for checking
      const outputDir = path.join(__dirname, 'scratch');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outputDir, 'test-raw-output.bin'), audioBuffer);
      console.log("Wrote raw audio buffer to scratch/test-raw-output.bin");
    } else {
      console.error("Response did not contain inlineData.data:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Error parsing success data:", e);
  }
}

runTest();
