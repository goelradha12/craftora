/* ============================================================
   aiPromptService.js — networking only.
   Calls the Craftora AI server's Groq-backed prompt endpoint to
   turn a user's rough idea into an optimized image-generation
   prompt. No UI code, no DOM access.
   ============================================================ */

const API_BASE = import.meta.env.VITE_AI_API_URL || 'http://localhost:3001';

export async function generateOptimizedPrompt({ product, prompt, style, styleOther, colors }) {
    const res = await fetch(`${API_BASE}/api/ai/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, prompt, style, styleOther, colors }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Failed to generate an optimized prompt.');
    }
    return data.optimizedPrompt;
}
