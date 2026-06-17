const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config();

// In-memory cache for audio generation
const audioCache = new Map();
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory leaks

/**
 * Pre-calculated 54-byte WAV header for 24kHz 16-bit Mono PCM.
 * Includes a 10-byte 'JUNK' chunk to align the header to a multiple of 3 (54 bytes),
 * allowing direct Base64 concatenation with the PCM data without re-encoding.
 */
const WAV_HEADER_BASE64 = "UklGRgAAAABXQVZFSlVOSwIAAAAAAGZtdCAQAAAAAQABAMBdAACAuwAAAgAQAGRhdGEAAAAA";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

    // Bolt ⚡ Optimization: Zero-copy Base64 concatenation.
    // Instead of decoding PCM -> adding header -> re-encoding to Base64,
    // we use a pre-calculated 54-byte header that is already Base64-aligned.
    const audioUrl = `data:audio/wav;base64,${WAV_HEADER_BASE64}${part.inlineData.data}`;

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
