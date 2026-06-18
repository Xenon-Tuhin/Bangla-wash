const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config();

// In-memory cache for audio generation
const audioCache = new Map();
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory leaks

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Calculates the actual byte length of a Base64 encoded string.
 */
function getBase64ByteLength(base64String) {
  const trimmed = base64String.trim();
  const len = trimmed.length;
  let padding = 0;
  if (trimmed.endsWith('==')) padding = 2;
  else if (trimmed.endsWith('=')) padding = 1;
  return Math.floor((len * 3) / 4) - padding;
}

// Pre-defined maps and regex for performance
const EMOTION_MAP = {
  'laughing': 'laughs',
  'laugh': 'laughs',
  'giggling': 'giggles',
  'giggle': 'giggles',
  'sighing': 'sighs',
  'sigh': 'sighs',
  'whispering': 'whispers',
  'whisper': 'whispers',
  'yawning': 'yawn',
  'gasping': 'gasp',
  'coughing': 'cough',
  'screaming': 'screams',
  'excited': 'excited',
  'playful': 'amused',
  'happy': 'happy',
  'sad': 'sad',
  'angry': 'angry'
};

const STRICT_REGEX = /^(\w+):\s*(?:\(([^)]+)\))?\s*\[([^\]]+)\]$/;
const STANDARD_REGEX = /^(\w+):\s*(.*)$/;
const EMOTION_INLINE_REGEX = /\(([^)]+)\)/g;

// Script Parser Function
function parseScript(rawScript) {
  const lines = rawScript.split('\n');
  const processedLines = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Strict format: Speaker: (emotion) [dialogue] or Speaker: [dialogue]
    const match = line.match(STRICT_REGEX);
    
    if (match) {
      const speaker = match[1];
      const emotionRaw = match[2];
      const dialogue = match[3];
      
      let emotionTag = '';
      if (emotionRaw) {
        const cleanEmotion = emotionRaw.trim().toLowerCase();
        const mapped = EMOTION_MAP[cleanEmotion] || cleanEmotion;
        emotionTag = `[${mapped}] `;
      }
      
      processedLines.push(`${speaker}: ${emotionTag}${dialogue}`);
    } else {
      // Fallback: Speaker: rest_of_line
      const stdMatch = line.match(STANDARD_REGEX);
      
      if (stdMatch) {
        const speaker = stdMatch[1];
        let rest = stdMatch[2];
        
        // Replace any (emotion) in the rest of the line with [mapped_emotion]
        rest = rest.replace(EMOTION_INLINE_REGEX, (m, g1) => {
          const cleanEmotion = g1.trim().toLowerCase();
          const mapped = EMOTION_MAP[cleanEmotion] || cleanEmotion;
          return `[${mapped}]`;
        });
        
        processedLines.push(`${speaker}: ${rest}`);
      } else {
        processedLines.push(line);
      }
    }
  }
  
  return processedLines.join('\n');
}

// Generate Audio Route
app.post('/api/generate-audio', async (req, res) => {
  const { scriptText, directorNotes, xenonVoice, silicaVoice } = req.body;
  
  if (!scriptText) {
    return res.status(400).json({ error: "Script text is required" });
  }

  // Generate a unique cache key based on the request payload
  const cacheKey = crypto.createHash('md5')
    .update(JSON.stringify({ scriptText, directorNotes, xenonVoice, silicaVoice }))
    .digest('hex');

  // Check cache first
  if (audioCache.has(cacheKey)) {
    console.log("⚡ Serving audio from cache (key:", cacheKey, ")");
    return res.json({ audioUrl: audioCache.get(cacheKey) });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set in backend server environment" });
  }

  // 1. Process script with regex parser
  const parsedDialogue = parseScript(scriptText);
  
  // 2. Prepended director's note
  let finalPrompt = '';
  if (directorNotes && directorNotes.trim()) {
    finalPrompt = `[Director's Note: ${directorNotes.trim()}]\n\n${parsedDialogue}`;
  } else {
    finalPrompt = parsedDialogue;
  }

  console.log("----- Parsed Prompt Sent to Gemini TTS -----");
  console.log(finalPrompt);
  console.log("--------------------------------------------");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

  // Build the multi-speaker payload
  const payload = {
    contents: [
      {
        parts: [
          {
            text: finalPrompt
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: "Xenon",
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: xenonVoice || "Fenrir"
                }
              }
            },
            {
              speaker: "Silica",
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: silicaVoice || "Leda"
                }
              }
            }
          ]
        }
      }
    }
  };

  try {
    const apiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Gemini API Error Response:", data);
      return res.status(apiResponse.status).json({ 
        error: "Gemini API error", 
        details: data.error?.message || JSON.stringify(data) 
      });
    }

    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (!part || !part.inlineData || !part.inlineData.data) {
      console.error("Gemini API response does not contain audio:", data);
      return res.status(500).json({ error: "Gemini API response did not contain audio data" });
    }

    // Optimized: Add WAV header without decoding/re-encoding the large PCM Base64 payload.
    // We use a 54-byte header (standard 44 bytes + 10-byte JUNK chunk) to ensure the
    // header's Base64 representation is exactly 72 characters (multiple of 3 bytes),
    // allowing for direct string concatenation.
    const pcmBase64 = part.inlineData.data;
    const pcmByteLength = getBase64ByteLength(pcmBase64);
    
    const header = Buffer.allocUnsafe(54);
    const subChunk2Size = pcmByteLength;
    const chunkSize = 36 + 10 + subChunk2Size; // 36 + 10 (JUNK) + data
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    header.write("RIFF", 0);
    header.writeUInt32LE(chunkSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // JUNK chunk to pad to 54 bytes for Base64 alignment
    header.write("JUNK", 36);
    header.writeUInt32LE(2, 40); // Chunk size
    header.writeUInt16LE(0, 44); // Chunk data
    
    header.write("data", 46);
    header.writeUInt32LE(subChunk2Size, 50);

    const headerBase64 = header.toString('base64');
    const audioUrl = `data:audio/wav;base64,${headerBase64}${pcmBase64}`;

    // Store in cache before sending response
    if (audioCache.size >= MAX_CACHE_SIZE) {
      // Evict oldest entry (first key in Map)
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, audioUrl);

    res.json({ audioUrl });

  } catch (error) {
    console.error("Error in generate-audio:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Fallback to index.html for single page app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
