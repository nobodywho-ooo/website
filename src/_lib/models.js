// Human-readable labels for each model pipeline/capability key. Shared by the
// `pipelineLabel` Nunjucks filter (used on /models/) and the JSON API so agents
// can match natural queries like "speech to text" against camelCase keys.
export const pipelineLabels = {
  textGeneration: "Text generation",
  imageToImage: "Image to Image",
  imageTextToText: "Image/Text to Text",
  audioTextToText: "Audio/Text to Text",
  imageAudioTextToText: "Image/Audio/Text to Text",
  textToSpeech: "Text To Speech",
  speechToText: "Speech To Text",
  voiceActivityDetection: "Voice Activity Detection",
  featureExtraction: "Feature extraction",
  textRanking: "Text ranking",
};

export const pipelineLabel = (key) => pipelineLabels[key] || key;

// Flatten every model across all labs/families into a single list, annotated
// with its lab/family context and sorted newest-first by release date.
//
// Shared by the `allModels` Nunjucks filter (used on /models/) and the machine
// -readable JSON API (/api/models.json) so both stay in sync from one source.
export function flattenModels(labs, families) {
  const list = [];
  for (const lab of labs) {
    for (const familyKey of lab.families || []) {
      const family = families[familyKey];
      if (!family) continue;
      for (const model of family.models || []) {
        list.push({
          labName: lab.name,
          familyName: family.name,
          familyLogo: family.logo,
          pipeline: family.pipeline,
          languages: family.languages || [],
          variant: model.variant,
          idealDeviceDeployment: model.idealDeviceDeployment || "",
          sizeGB: model.sizeGB,
          parameterCountBillions: model.parameterCountBillions,
          releaseDate: model.releaseDate || "",
          tags: model.tags || [],
          thinking: model.thinking || false,
          recommended: model.recommended || false,
          huggingface: model.huggingface,
          downloadLinks: model.downloadLinks || [],
        });
      }
    }
  }
  return list.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}
