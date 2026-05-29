const crypto = require('crypto');
const assert = require('assert');

// Mock getBase64ByteLength
function getBase64ByteLength(base64String) {
  let len = base64String.length;
  if (base64String.endsWith('==')) len -= 2;
  else if (base64String.endsWith('=')) len -= 1;
  return (len * 3) / 4;
}

function testOptimization() {
  const dummyPcm = Buffer.from('Hello World, this is some PCM data!');
  const base64Pcm = dummyPcm.toString('base64');
  const pcmByteLength = dummyPcm.length;

  // Logic from server.js
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  const subChunk2Size = pcmByteLength;
  const chunkSize = 36 + subChunk2Size + 10;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const header = Buffer.allocUnsafe(54);
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
  header.write("JUNK", 36);
  header.writeUInt32LE(2, 40);
  header.writeUInt16LE(0, 44);
  header.write("data", 46);
  header.writeUInt32LE(subChunk2Size, 50);

  const base64Header = header.toString('base64');
  const fullBase64 = base64Header + base64Pcm;

  // Verify by decoding
  const decoded = Buffer.from(fullBase64, 'base64');

  assert.strictEqual(decoded.slice(0, 4).toString(), 'RIFF');
  assert.strictEqual(decoded.readUInt32LE(4), chunkSize);
  assert.strictEqual(decoded.slice(8, 12).toString(), 'WAVE');
  assert.strictEqual(decoded.slice(12, 16).toString(), 'fmt ');
  assert.strictEqual(decoded.slice(46, 50).toString(), 'data');
  assert.strictEqual(decoded.readUInt32LE(50), subChunk2Size);

  // The actual PCM data should start at offset 54
  assert.strictEqual(decoded.slice(54).toString(), 'Hello World, this is some PCM data!');

  console.log("Optimization logic verified successfully!");
}

testOptimization();
