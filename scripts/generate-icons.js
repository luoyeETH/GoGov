const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const COLORS = {
  background: [244, 239, 232, 255],
  brand: [181, 82, 43, 255],
  accent: [255, 250, 243, 255],
  sun: [255, 170, 60, 255],   // Warm Orange-Yellow
  wave: [50, 55, 60, 255]     // Dark Grey
};

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  const body = Buffer.concat([typeBuf, data]);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function setPixel(pixels, width, x, y, color) {
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function drawCircle(pixels, width, height, cx, cy, radius, color) {
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height, Math.ceil(cy + radius));

  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) {
        setPixel(pixels, width, x, y, color);
      }
    }
  }
}

function drawRect(pixels, width, height, x, y, w, h, color) {
  const xEnd = Math.min(width, x + w);
  const yEnd = Math.min(height, y + h);
  for (let j = Math.max(0, y); j < yEnd; j += 1) {
    for (let i = Math.max(0, x); i < xEnd; i += 1) {
      setPixel(pixels, width, i, j, color);
    }
  }
}

function drawFilledSineWave(pixels, width, height, yBase, amplitude, frequency, phase, color) {
  for (let x = 0; x < width; x++) {
    // Normalized x from 0 to 2*PI * cycles
    const angle = (x / width) * (Math.PI * 2 * frequency) + phase;
    const ySurface = yBase + Math.sin(angle) * amplitude;
    
    // Fill from ySurface down to height
    for (let y = Math.max(0, Math.floor(ySurface)); y < height; y++) {
        setPixel(pixels, width, x, y, color);
    }
  }
}

function maskOutsideCircle(pixels, width, height, cx, cy, radius, bgColor) {
    const r2 = radius * radius;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
             const dx = x + 0.5 - cx;
             const dy = y + 0.5 - cy;
             if (dx*dx + dy*dy > r2) {
                 setPixel(pixels, width, x, y, bgColor);
             }
        }
    }
}

function generateIcon(size, outPath) {
  const width = size;
  const height = size;
  const pixels = new Uint8Array(width * height * 4);

  // 1. Fill Background
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = COLORS.background[0];
    pixels[i + 1] = COLORS.background[1];
    pixels[i + 2] = COLORS.background[2];
    pixels[i + 3] = COLORS.background[3];
  }

  const cx = width / 2;
  const cy = height / 2;
  
  // Icon parameters
  const mainRadius = width * 0.45; // The bounding circle size
  
  // 2. Draw Sun (Upper Half)
  // Positioned slightly above center
  const sunRadius = mainRadius * 0.55;
  const sunCy = cy - mainRadius * 0.2; 
  drawCircle(pixels, width, height, cx, sunCy, sunRadius, COLORS.sun);
  
  // 3. Draw Waves (Lower Half)
  // Starting around the middle
  const waveBaseY = cy + mainRadius * 0.1; 
  const waveAmp = mainRadius * 0.1;
  const waveFreq = 2.5; // Waves across the width

  // Draw wave
  drawFilledSineWave(pixels, width, height, waveBaseY, waveAmp, waveFreq, 0, COLORS.wave);

  // 4. Mask to create the circular "Badge" shape
  // This cuts off the square wave bottoms and any sun overflow
  maskOutsideCircle(pixels, width, height, cx, cy, mainRadius, COLORS.background);

  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0;
    const pixelOffset = y * width * 4;
    Buffer.from(pixels.buffer, pixelOffset, width * 4).copy(
      raw,
      rowOffset + 1
    );
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const data = zlib.deflateSync(raw);
  const png = Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", data),
    pngChunk("IEND", Buffer.alloc(0))
  ]);

  fs.writeFileSync(outPath, png);
}

const outDir = path.resolve(__dirname, "..", "apps", "web", "public");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

generateIcon(32, path.join(outDir, "favicon.png"));
generateIcon(180, path.join(outDir, "apple-touch-icon.png"));
