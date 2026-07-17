const { InferenceClient } = require('@huggingface/inference');

const MODEL = 'black-forest-labs/FLUX.1-schnell';

async function generateImage(prompt) {
  const client = new InferenceClient(process.env.HF_API_KEY);

  let imageBlob;
  try {
    imageBlob = await client.textToImage({
      model: MODEL,
      inputs: prompt,
      provider: 'auto',
    });
  } catch (err) {
    const error = new Error('Image generation failed');
    error.status = 502;
    error.detail = err.message;
    throw error;
  }

  const buffer = Buffer.from(await imageBlob.arrayBuffer());
  const contentType = imageBlob.type || 'image/png';
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

module.exports = { generateImage };
