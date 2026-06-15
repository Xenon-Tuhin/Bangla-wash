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

function getBase64ByteLength(base64String) {
  let len = base64String.length;
  // Handle padding
  if (base64String.endsWith('==')) len -= 2;
  else if (base64String.endsWith('=')) len -= 1;
  return Math.floor((len * 3) / 4);
}

function get54ByteWavHeaderBase64(pcmLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const header = Buffer.allocUnsafe(54);

  // RIFF Header
  header.write("RIFF", 0);
  header.writeUInt32LE(46 + pcmLength, 4); // 54 - 8 + pcmLength
  header.write("WAVE", 8);

  // JUNK Chunk (10 bytes) to align to 3 bytes (54 is multiple of 3)
  header.write("JUNK", 12);
  header.writeUInt32LE(2, 16); // Size of junk data
  header.writeUInt16LE(0, 20); // 2 bytes of junk data

  // fmt Chunk
  header.write("fmt ", 22);
  header.writeUInt32LE(16, 26);
  header.writeUInt16LE(1, 30);
  header.writeUInt16LE(numChannels, 32);
  header.writeUInt32LE(sampleRate, 34);
  header.writeUInt32LE(byteRate, 38);
  header.writeUInt16LE(blockAlign, 42);
  header.writeUInt16LE(bitsPerSample, 44);

  // data Chunk
  header.write("data", 46);
  header.writeUInt32LE(pcmLength, 50);

  return header.toString('base64');
}

// Generate dummy PCM data (approx 5MB)
const dummyPcm = Buffer.alloc(5 * 1024 * 1024, 0x12);
const dummyBase64 = dummyPcm.toString('base64');

console.log(`Benchmarking with ${dummyPcm.length} bytes of PCM data...`);

const iterations = 100;

console.time('Current Method (Decode -> Header -> Encode)');
for (let i = 0; i < iterations; i++) {
  const pcmBuffer = Buffer.from(dummyBase64, 'base64');
  const wavBuffer = addWavHeader(pcmBuffer, 24000, 1, 16);
  const base64Wav = wavBuffer.toString('base64');
}
console.timeEnd('Current Method (Decode -> Header -> Encode)');

console.time('Optimized Method (Zero-copy Base64 concatenation)');
for (let i = 0; i < iterations; i++) {
  const pcmLen = getBase64ByteLength(dummyBase64);
  const headerBase64 = get54ByteWavHeaderBase64(pcmLen);
  const finalBase64 = headerBase64 + dummyBase64;
}
console.timeEnd('Optimized Method (Zero-copy Base64 concatenation)');

// Verify correctness
const pcmLen = getBase64ByteLength(dummyBase64);
const headerBase64 = get54ByteWavHeaderBase64(pcmLen);
const finalBase64 = headerBase64 + dummyBase64;
const finalBuffer = Buffer.from(finalBase64, 'base64');

console.log('Final buffer size:', finalBuffer.length);
console.log('Expected size:', 54 + dummyPcm.length);

if (finalBuffer.length === 54 + dummyPcm.length) {
  console.log('Success: Buffer size matches!');
} else {
  console.log('Failure: Buffer size mismatch!');
}

console.log('Header preview:', finalBuffer.slice(0, 54).toString('hex'));
console.log('Data preview (start):', finalBuffer.slice(54, 60).toString('hex'));
