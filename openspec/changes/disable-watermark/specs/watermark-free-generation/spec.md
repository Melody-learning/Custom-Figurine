## ADDED Requirements

### Requirement: 即梦模型生成图片无水印

所有通过即梦 (Jimeng/Seedream) 模型生成的图片必须不包含平台水印。通过 Ark API 的 `watermark` 参数显式关闭。

#### Scenario: 即梦模型生成图片时关闭水印
- **WHEN** 用户通过任意即梦模型（如 seedream-3.0, seedream-5.0-lite）触发图片生成
- **THEN** 发送到 Ark API 的请求体中包含 `"watermark": false` 参数
- **THEN** 生成的图片不包含即梦/火山方舟水印

#### Scenario: Gemini 模型不受影响
- **WHEN** 用户通过 Gemini 模型触发图片生成
- **THEN** GeminiAdapter 行为不变（Gemini API 本身不添加水印）
