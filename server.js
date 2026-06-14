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
 * Helper to calculate the exact byte length of a Base64 string without decoding.
 * Handles padding characters and optional whitespace.
 */
function getBase64ByteLength(base64String) {
  const trimmed = base64String.trim();
  const len = trimmed.length;
  let padding = 0;
  if (trimmed.endsWith('==')) padding = 2;
  else if (trimmed.endsWith('=')) padding = 1;
  return Math.floor((len * 3) / 4) - padding;
}

/**
 * Returns a 54-byte WAV header in Base64.
 * The 54-byte size (a multiple of 3) ensures the resulting Base64 string
 * has no padding and can be directly concatenated with the audio Base64.
 * Uses a 10-byte 'JUNK' chunk to align the standard 44-byte header.
 */
function get54ByteWavHeaderBase64(dataLength, sampleRate = 24000) {
  const totalHeaderSize = 54;
  const pcmLength = dataLength;
  const buffer = Buffer.allocUnsafe(totalHeaderSize);

  // Standard RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + 10 + pcmLength, 4); // 36 (std) + 10 (junk) + pcm
  buffer.write('WAVE', 8);

  // JUNK chunk for alignment (10 bytes total: 4 ID, 4 size, 2 data)
  buffer.write('JUNK', 12);
  buffer.writeUInt32LE(2, 16); // Chunk size is 2 bytes
  buffer.writeUInt16LE(0, 20); // 2 bytes of zero data

  // FMT chunk
  buffer.write('fmt ', 22);
  buffer.writeUInt32LE(16, 26);
  buffer.writeUInt16LE(1, 30); // PCM format
  buffer.writeUInt16LE(1, 32); // Mono
  buffer.writeUInt32LE(sampleRate, 34);
  buffer.writeUInt32LE(sampleRate * 2, 38); // Byte rate (16-bit mono)
  buffer.writeUInt16LE(2, 42); // Block align
  buffer.writeUInt16LE(16, 44); // Bits per sample

  // Data chunk header
  buffer.write('data', 46);
  buffer.writeUInt32LE(pcmLength, 50);

  return buffer.toString('base64');
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

  // Use default voices if not provided for consistent cache keys
  const xVoice = xenonVoice || "Fenrir";
  const sVoice = silicaVoice || "Leda";

  // Generate a unique cache key based on the request payload
  const cacheKey = crypto.createHash('md5')
    .update(JSON.stringify({ scriptText, directorNotes, xenonVoice: xVoice, silicaVoice: sVoice }))
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
                  voiceName: xVoice
                }
              }
            },
            {
              speaker: "Silica",
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: sVoice
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

    // Optimized zero-copy Base64 concatenation.
    // Prepend a pre-aligned 54-byte WAV header directly to the Base64 PCM data.
    const base64Pcm = part.inlineData.data;
    const pcmByteLength = getBase64ByteLength(base64Pcm);
    const headerBase64 = get54ByteWavHeaderBase64(pcmByteLength, 24000);
    
    const audioUrl = `data:audio/wav;base64,${headerBase64}${base64Pcm}`;

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
