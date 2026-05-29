const crypto = require('crypto');

function addWavHeader(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const subChunk2Size = pcmBuffer.length;
  const chunkSize = 36 + subChunk2Size;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const totalBuffer = Buffer.allocUnsafe(44 + subChunk2Size);

  totalBuffer.write("RIFF", 0);
  totalBuffer.writeUInt32LE(chunkSize, 4);
  totalBuffer.write("WAVE", 8);
  totalBuffer.write("fmt ", 12);
  totalBuffer.writeUInt32LE(16, 16);
  totalBuffer.writeUInt16LE(1, 20);
  totalBuffer.writeUInt16LE(numChannels, 22);
  totalBuffer.writeUInt32LE(sampleRate, 24);
  totalBuffer.writeUInt32LE(byteRate, 28);
  totalBuffer.writeUInt16LE(blockAlign, 32);
  totalBuffer.writeUInt16LE(bitsPerSample, 34);
  totalBuffer.write("data", 36);
  totalBuffer.writeUInt32LE(subChunk2Size, 40);

  pcmBuffer.copy(totalBuffer, 44);

  return totalBuffer;
}

// Optimization: Zero-copy base64 concatenation
function getBase64ByteLength(base64String) {
  let len = base64String.length;
  if (base64String.endsWith('==')) len -= 2;
  else if (base64String.endsWith('=')) len -= 1;
  return (len * 3) / 4;
}

function fastAddWavHeader(base64Pcm, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const pcmByteLength = getBase64ByteLength(base64Pcm);
  const subChunk2Size = pcmByteLength;
  const chunkSize = 36 + subChunk2Size + 10; // +10 for JUNK chunk
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // 54 bytes header (44 standard + 10 JUNK)
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

  // JUNK chunk to pad to 54 bytes (multiple of 3)
  header.write("JUNK", 36);
  header.writeUInt32LE(2, 40); // 2 bytes of data in JUNK chunk
  header.writeUInt16LE(0, 44); // 2 bytes of zero padding

  header.write("data", 46);
  header.writeUInt32LE(subChunk2Size, 50);

  const base64Header = header.toString('base64');
  return base64Header + base64Pcm;
}

// Generate some dummy PCM data (1MB)
const dummyPcm = Buffer.alloc(1024 * 1024);
const base64Pcm = dummyPcm.toString('base64');

const iterations = 1000;

console.log(`Running benchmark with ${iterations} iterations and 1MB payload...`);

// Standard approach
console.time('Standard');
for (let i = 0; i < iterations; i++) {
  const pcmBuffer = Buffer.from(base64Pcm, 'base64');
  const wavBuffer = addWavHeader(pcmBuffer);
  const base64Wav = wavBuffer.toString('base64');
}
console.timeEnd('Standard');

// Fast approach
console.time('Fast (Zero-Copy)');
for (let i = 0; i < iterations; i++) {
  const base64Wav = fastAddWavHeader(base64Pcm);
}
console.timeEnd('Fast (Zero-Copy)');

// Verify correctness
const standardResult = addWavHeader(Buffer.from(base64Pcm, 'base64')).toString('base64');
const fastResult = fastAddWavHeader(base64Pcm);

// Note: They won't be exactly the same because of the JUNK chunk and different sizes in RIFF header
// but we should verify if the resulting fastResult is a valid WAV (at least the header part)
const fastBuffer = Buffer.from(fastResult, 'base64');
console.log('Fast result total length:', fastBuffer.length);
console.log('Fast result header (first 54 bytes):', fastBuffer.slice(0, 54).toString('hex'));
console.log('Fast result RIFF tag:', fastBuffer.slice(0, 4).toString());
console.log('Fast result WAVE tag:', fastBuffer.slice(8, 12).toString());
console.log('Fast result data tag:', fastBuffer.slice(46, 50).toString());
