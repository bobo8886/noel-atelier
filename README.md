<p align="center"><a href="https://bobo8886.github.io/noel-atelier/?lang=en"><img src="./assets/brand/noel-banner.svg" width="100%" alt="Noël Atelier · Pour toi"></a></p>

<p align="center"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

<p align="center">Pull a ribbon, light a Christmas tree, and send someone a wish they can open.</p>

<p align="center">
  <a href="https://bobo8886.github.io/noel-atelier/?lang=en"><img alt="Open the gift" src="https://img.shields.io/badge/Open_the_gift_%E2%86%97-245546?style=for-the-badge"></a>
  &nbsp;
  <a href="https://github.com/bobo8886/noel-atelier/releases/latest/download/noel-atelier-offline.html"><img alt="Download offline HTML" src="https://img.shields.io/badge/Download_offline_HTML-67502E?style=for-the-badge"></a>
</p>

<p align="center">
  <a href="https://github.com/bobo8886/noel-atelier/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/bobo8886/noel-atelier?label=release&amp;color=4a6655"></a>
  <a href="./LICENSE"><img alt="Project license: MIT" src="https://img.shields.io/badge/license-MIT-786039"></a>
  <a href="https://github.com/bobo8886/noel-atelier/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/bobo8886/noel-atelier?style=flat&amp;color=836749"></a>
</p>

## Inside the parcel

The bow comes undone, the box folds open, and a fir grows above a frozen lake. Code draws its trunk, needles, ornaments and lights. Drag to walk your view around the tree, or hold your finger over a branch and let a wish take flight. The closing scene leaves you with a postcard of your tree.

<p align="center"><img src="./assets/brand/parcel-preview.webp" width="48%" alt="An unopened pine-green parcel tied with red ribbon"> <img src="./assets/brand/tree-preview.webp" width="48%" alt="The illuminated fir reflecting in the lake, captured from the running scene"></p>

## Send it to someone

1. Open the gift and choose the envelope in the top toolbar. Enter a name, an optional signature, and a message. Seal the gift to download a personalized HTML file.
2. Send that file as an attachment. Your recipient can save it and open it in a browser, even offline. The parcel starts sealed, the greeting bears their name, and your message appears on the final card.
3. Choose **Save postcard** to keep a PNG, or **Send a gift back** to seal a new parcel. A wish written during the visit also appears on the postcard.

## Four ways to play

| Effect | Mouse or touch | With the camera |
| --- | --- | --- |
| Galaxy | Choose **Galaxy** and move across the sky to steer the stars. | Open your palm and move your hand. |
| Lights | Choose **Lights** to gather the tree and light it from the bottom up. | Make a fist. |
| Snow | Choose **Snow** and move left or right to change the wind. | Make a V sign and move sideways. |
| Wish | Hold the tree to gather light, then release. Choose **Write a wish** to add your own words. | Pinch your thumb and index finger, hold, then release. |

Use **Tab** and **Enter** to operate the controls. With the tree focused, the left and right arrows rotate the view and holding **Space** charges a wish. You can switch between English and Simplified Chinese inside the gift.

## Online, offline, or local

| Edition | How to open it |
| --- | --- |
| Live website | Open the [English edition](https://bobo8886.github.io/noel-atelier/?lang=en) or [中文页面](https://bobo8886.github.io/noel-atelier/?lang=zh). Mouse, touch and keyboard work immediately. Camera gestures are optional. |
| Single HTML | Save the [offline gift](https://github.com/bobo8886/noel-atelier/releases/latest/download/noel-atelier-offline.html), then double-click it. It includes both languages, the animations, audio, postcard exporter and return-gift maker. |
| Complete edition | Extract the [release ZIP](https://github.com/bobo8886/noel-atelier/releases/latest/download/noel-atelier.zip). It includes the portable HTML and the source edition with its local camera model. |
| GitHub Packages | The same ZIP is published as the Maven artifact `io.github.bobo8886:noel-atelier:1.0.0`. For a download without signing in, use Releases. [Package registry](https://github.com/users/bobo8886/packages?repo_name=noel-atelier) · [Releases](https://github.com/bobo8886/noel-atelier/releases/latest) |

To run the source edition, open the directory containing `server.mjs` and run the following command with Node.js installed. On Windows, you can also double-click `启动圣诞工坊.cmd`.

```sh
node server.mjs
```

Open the localhost address printed in the terminal. After unwrapping, choose the camera control and grant browser permission to use hand gestures. Video frames are processed on your device. The single-file edition uses mouse, touch and keyboard. The scene uses WebGL when available and switches to Canvas 2D when needed.

To rebuild the portable HTML after editing the source, use Node.js 18 or later. The build writes `assets/gift-template.html`, which also supplies the template for personalized gifts.

```sh
npm ci
npm run build
```

## License and credits

Original code, artwork and the ribbon-tree mark are released under the MIT License. Three.js, MediaPipe, Phosphor Icons, Cormorant Garamond and DM Sans keep their respective licenses. [MIT License](./LICENSE) · [Third-party notices](./THIRD_PARTY_NOTICES.md)
