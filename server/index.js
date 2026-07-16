require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateOptimizedPrompt } = require('./services/groqService');
const { generateImage } = require('./services/huggingfaceService');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/ai/prompt', async (req, res) => {
  const { product, prompt, style, styleOther, colors } = req.body || {};
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'A design description is required' });
  }

  try {
    const optimizedPrompt = await generateOptimizedPrompt({
      product,
      prompt,
      style,
      styleOther,
      colors,
    });
    res.json({ optimizedPrompt });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, detail: err.detail });
  }
});

app.post('/api/ai/image', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'A prompt is required' });
  }

  try {
    const image = await generateImage(prompt);
    res.json({ image });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, detail: err.detail });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Craftora AI server listening on port ${port}`);
});
