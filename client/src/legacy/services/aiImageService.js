/* ============================================================
   aiImageService.js — networking only.
   Calls the Craftora AI server's HuggingFace-backed image
   endpoint (FLUX.1-schnell) to render an optimized prompt into
   an image. No UI code, no DOM access.
   ============================================================ */

const API_BASE = import.meta.env.VITE_AI_API_URL || 'http://localhost:3001';

export async function generateImage(prompt) {
    const res = await fetch(`${API_BASE}/api/ai/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Failed to generate an image.');
    }
    return data.image;
}
