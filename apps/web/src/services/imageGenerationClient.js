export async function generateImageFromPrompt({ prompt, size = '1024x1024', quality = 'auto' } = {}) {
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) {
    return { ok: false, error: 'No image prompt supplied.' };
  }

  try {
    const response = await fetch('/api/create-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: cleanPrompt, size, quality }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.error || `Image route failed with status ${response.status}.`,
        nextAction: data.nextAction || 'Check provider setup and retry.',
      };
    }
    return data;
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Image generation failed safely.',
      nextAction: 'Check the deployment and /api/create-image route.',
    };
  }
}

export function buildImagePromptFromCreatorPlan(plan = {}, fallbackInput = '') {
  const direct = plan.imageGeneration?.prompt;
  if (direct) return direct;
  const input = String(fallbackInput || '').trim();
  if (!input) return '';
  return `Create a polished production image for Core Self based on this request: ${input}`;
}
