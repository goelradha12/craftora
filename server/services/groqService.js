const SYSTEM_PROMPT = `You are an expert prompt engineer for AI image generation focused on printable merchandise.

Convert the user's idea into a professional image-generation prompt.

Rules:

- Produce artwork only.
- Never create product mockups.
- Never mention mugs, bottles, t-shirts or diaries.
- Create centered printable artwork.
- Respect the printable orientation of the selected product.
- Respect the requested artistic style.
- Respect requested colors.
- Prefer flat vector illustrations unless another style is requested.
- Transparent or white background.
- No watermark.
- No signature.
- No frame.
- High resolution.
- Keep under 120 words.
- Return ONLY the optimized prompt.`;

const ORIENTATION_BY_PRODUCT = {
  bottle: 'horizontal wrap layout',
  mug: 'horizontal wrap layout',
  cup: 'horizontal wrap layout',
  diary: 'portrait layout',
  't-shirt': 'portrait chest layout',
  tshirt: 'portrait chest layout',
};

function orientationFor(product) {
  const key = String(product || '').trim().toLowerCase();
  return ORIENTATION_BY_PRODUCT[key] || 'centered layout';
}

async function generateOptimizedPrompt({ product, prompt, style, styleOther, colors }) {
  const resolvedStyle = style === 'Other' && styleOther ? styleOther : style;
  const userMessage = [
    `Product: ${product || 'Unknown'}`,
    `Prompt: ${prompt}`,
    `Style: ${resolvedStyle || 'Unspecified'}`,
    `Colors: ${colors || 'Unspecified'}`,
    `Orientation: ${orientationFor(product)}`,
  ].join('\n');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const error = new Error('Groq request failed');
    error.status = 502;
    error.detail = detail;
    throw error;
  }

  const data = await res.json();
  const optimizedPrompt = data?.choices?.[0]?.message?.content?.trim();
  if (!optimizedPrompt) {
    const error = new Error('Groq returned no prompt');
    error.status = 502;
    throw error;
  }

  return optimizedPrompt;
}

module.exports = { generateOptimizedPrompt };
