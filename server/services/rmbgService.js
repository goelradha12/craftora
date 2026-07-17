const Jimp = require('jimp');

// Default tolerance for the flood-fill background removal — how close a
// pixel's color must be to the border reference color to be treated as
// background. 0 = exact match only, ~440 = max possible RGB distance.
// Fixed at 100 (not user-configurable) — tuned for photos generated on the
// solid white background we now explicitly ask the image model for (see
// groqService's "design" output-type rules).
const DEFAULT_TOLERANCE = 100;

function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Average color of the outermost ring of pixels — the canonical "background
// color" every candidate pixel is measured against. Using a single fixed
// reference (instead of comparing each pixel to its already-cleared neighbor)
// avoids "color creep": with a neighbor-chained comparison, tolerance drift
// across a smooth gradient or anti-aliased edge can cascade all the way
// through the subject and wipe the whole image.
function borderReferenceColor(image) {
  const { width, height, data } = image.bitmap;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  function addPixel(x, y) {
    const off = (y * width + x) * 4;
    rSum += data[off]; gSum += data[off + 1]; bSum += data[off + 2];
    count++;
  }

  for (let x = 0; x < width; x++) { addPixel(x, 0); addPixel(x, height - 1); }
  for (let y = 0; y < height; y++) { addPixel(0, y); addPixel(width - 1, y); }

  return { r: rSum / count, g: gSum / count, b: bSum / count };
}

// Flood-fills from every edge pixel inward, clearing the alpha channel of any
// pixel connected to the border whose color falls within `tolerance` of the
// fixed background reference color. This removes a (roughly) uniform
// background — e.g. the solid white background we now explicitly ask the
// image model for — without needing a background-removal ML model.
function floodFillBackground(image, tolerance) {
  const { width, height, data } = image.bitmap;
  const ref = borderReferenceColor(image);
  const visited = new Uint8Array(width * height);
  const stack = [];

  function trySeed(x, y) {
    const idx = y * width + x;
    if (visited[idx]) return;
    const off = idx * 4;
    if (colorDistance(ref.r, ref.g, ref.b, data[off], data[off + 1], data[off + 2]) > tolerance) return;
    visited[idx] = 1;
    stack.push(x, y);
  }

  for (let x = 0; x < width; x++) { trySeed(x, 0); trySeed(x, height - 1); }
  for (let y = 0; y < height; y++) { trySeed(0, y); trySeed(width - 1, y); }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    const off = (y * width + x) * 4;
    data[off + 3] = 0;

    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (visited[nIdx]) continue;
      const nOff = nIdx * 4;
      const dist = colorDistance(ref.r, ref.g, ref.b, data[nOff], data[nOff + 1], data[nOff + 2]);
      if (dist <= tolerance) {
        visited[nIdx] = 1;
        stack.push(nx, ny);
      }
    }
  }
}

async function removeBackground(imageDataUrl, tolerance = DEFAULT_TOLERANCE) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(imageDataUrl || '');
  if (!match) {
    const error = new Error('Invalid image data for background removal');
    error.status = 500;
    throw error;
  }
  const buffer = Buffer.from(match[2], 'base64');

  let image;
  try {
    image = await Jimp.read(buffer);
  } catch (err) {
    const error = new Error('Background removal failed');
    error.status = 500;
    error.detail = err.message;
    throw error;
  }

  floodFillBackground(image, tolerance);

  const outBuffer = await new Promise((resolve, reject) => {
    image.getBuffer(Jimp.MIME_PNG, (err, buf) => (err ? reject(err) : resolve(buf)));
  });
  return `data:image/png;base64,${outBuffer.toString('base64')}`;
}

module.exports = { removeBackground, DEFAULT_TOLERANCE };
