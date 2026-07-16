async function generateImage(prompt) {
  const res = await fetch(
    'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!res.ok) {
    if (res.status === 503) {
      const detail = await res.json().catch(() => ({}));
      const error = new Error('Model is warming up, please try again shortly');
      error.status = 503;
      error.detail = detail;
      throw error;
    }
    const detail = await res.text().catch(() => '');
    const error = new Error('Image generation failed');
    error.status = 502;
    error.detail = detail;
    throw error;
  }

  const contentType = res.headers.get('Content-Type') || 'image/png';
  const buffer = Buffer.from(await res.arrayBuffer());
  const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

  return dataUrl;
}

module.exports = { generateImage };
