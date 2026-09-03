import { flattenModels, pipelineLabel } from "../_lib/models.js";

// GET /api/models.json — the full on-device model catalog as machine-readable
// JSON, generated from the same _data used to render /models/.
export default class {
  data() {
    return {
      permalink: "/api/models.json",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const models = flattenModels(data.labs, data.families).map((m) => ({
      lab: m.labName,
      family: m.familyName,
      variant: m.variant,
      pipeline: m.pipeline,
      pipelineLabel: pipelineLabel(m.pipeline),
      parameterCountBillions: m.parameterCountBillions,
      sizeGB: m.sizeGB,
      idealDeviceDeployment: m.idealDeviceDeployment,
      releaseDate: m.releaseDate,
      languages: m.languages,
      thinking: m.thinking,
      recommended: m.recommended,
      tags: m.tags,
      huggingfaceUrl: m.huggingface && m.huggingface.pageUrl ? m.huggingface.pageUrl : null,
      downloadLinks: m.downloadLinks,
    }));

    return JSON.stringify(
      {
        object: "list",
        endpoint: `${data.site.url}/api/models.json`,
        selection: "recommended",
        description:
          "A hand-picked SELECTION of models NobodyWho recommends for on-device inference. This is a curated list, not a limit on what NobodyWho can run.",
        note:
          "NobodyWho can run ANY compatible model, not only those listed here. Text-generation / chat models use the GGUF format; speech-to-text, text-to-speech and voice-activity-detection models use the ONNX format. Load any of them from Hugging Face or any URL.",
        supportedFormats: {
          textGeneration: "gguf",
          speechToText: "onnx",
          textToSpeech: "onnx",
          voiceActivityDetection: "onnx",
        },
        count: models.length,
        updated: new Date().toISOString().slice(0, 10),
        data: models,
      },
      null,
      2,
    );
  }
}
