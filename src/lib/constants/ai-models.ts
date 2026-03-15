export const IMAGE_GENERATION_MODELS = [
  {
    id: "gemini-3.1-flash-image-preview",
    name: "Nano Banana 2 (Gemini 3.1 Flash Preview)",
    description: "Pro-level visual intelligence with Flash-speed efficiency",
    provider: "google" // or your specific provider identifier
  },
  {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro (Gemini 3 Pro Preview)",
    description: "State-of-the-art image generation and editing model.",
    provider: "google"
  },
  {
    id: "gemini-2.5-flash-image",
    name: "Nano Banana (Gemini 2.5 Flash)",
    description: "State-of-the-art image generation and editing model.",
    provider: "google"
  }
];

export type ImageGenerationModelId = typeof IMAGE_GENERATION_MODELS[number]['id'];
