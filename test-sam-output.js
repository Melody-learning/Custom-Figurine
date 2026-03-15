import { AutoProcessor, AutoModel, env } from '@xenova/transformers';

import fs from 'fs';

env.allowLocalModels = false;

async function test() {
  console.log("Loading model...");
  const processor = await AutoProcessor.from_pretrained('Xenova/slimsam-77-uniform');
  const model = await AutoModel.from_pretrained('Xenova/slimsam-77-uniform');
  
  console.log("Model loaded. Testing dummy input...");
  // Dummy 1x1 image
  const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const inputs = await processor(dummyImage, {
    // [xmin, ymin, xmax, ymax]
    input_boxes: [[[0, 0, 1, 1]]]
  });
  
  try {
    const outputs = await model(inputs);
    console.log("Outputs keys:", Object.keys(outputs));
    if (outputs.pred_masks) {
        console.log("pred_masks.dims:", outputs.pred_masks.dims);
    }
  } catch (err) {
    fs.writeFileSync("sam-crash.json", JSON.stringify({name: err.name, message: err.message, stack: err.stack}, null, 2));
    console.error("Crash logged to sam-crash.json");
  }
}

test().catch(console.error);
