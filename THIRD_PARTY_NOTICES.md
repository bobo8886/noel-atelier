# Third-party notices

The MIT license in the project root covers Noël Atelier’s original code and artwork. The following components retain their upstream licenses. The camera edition includes all of them. The single-file edition embeds the renderer, icons and fonts.

| Component | Files in this repository | License |
| --- | --- | --- |
| Three.js r180 | `assets/three.core.js`, `assets/three.module.js` | [MIT, Three.js authors](assets/LICENSE) |
| Phosphor Icons | SVG icons under `assets/icons/` | [MIT, Phosphor Icons](assets/icons/LICENSE.txt) |
| Cormorant Garamond | `assets/fonts/serif.woff2`, `assets/fonts/italic.woff2` | [SIL Open Font License 1.1, The Cormorant Project Authors](assets/fonts/Cormorant-LICENSE.txt) |
| DM Sans | `assets/fonts/sans.woff2` | [SIL Open Font License 1.1, The DM Sans Project Authors](assets/fonts/DM-Sans-LICENSE.txt) |
| MediaPipe Tasks Vision 0.10.22-rc.20250304 | `assets/vision/vision_bundle.mjs`, JavaScript loaders and WebAssembly binaries in `assets/vision/wasm/` | [Apache License 2.0 and upstream notices](assets/vision/LICENSE.txt) |
| MediaPipe Gesture Recognizer, float16 version 1 | `assets/vision/gesture_recognizer.task` | [Apache License 2.0](assets/vision/LICENSE.txt) |
| esbuild | Development dependency for rebuilding the portable HTML | [MIT, Evan Wallace](https://github.com/evanw/esbuild/blob/main/LICENSE.md) |

Three.js renders the procedural scene. Phosphor provides the interface icons. The project’s ribbon-tree mark is original artwork. The banner lettering uses Cormorant Garamond and DM Sans. [Three.js r180](https://github.com/mrdoob/three.js/tree/r180) · [Phosphor Icons](https://github.com/phosphor-icons/core) · [Cormorant](https://github.com/CatharsisFonts/Cormorant) · [DM Fonts](https://github.com/googlefonts/dm-fonts)

The optional camera runtime uses the official `@mediapipe/tasks-vision` distribution. Its included license file also preserves upstream’s additional notice for its UTF routines. [Published runtime](https://www.npmjs.com/package/@mediapipe/tasks-vision/v/0.10.22-rc.20250304) · [MediaPipe license](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)

Google’s unmodified Gesture Recognizer bundle includes a palm detector, hand-landmark detector, gesture embedder and canned gesture classifier. The bundled file’s SHA-256 is `97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482`. MediaPipe’s maintainers identify Apache 2.0 as their default license for source and models. [Original model download](https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task) · [Google’s model documentation](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer#models) · [Maintainer’s licensing clarification](https://github.com/google-ai-edge/mediapipe/issues/6355#issuecomment-5997480830)
