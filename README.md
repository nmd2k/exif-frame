<p align="center">
  <img src="https://github.com/yurucam/exif-frame/assets/25793226/b9de5dc3-344a-4a3f-8cfb-ed4c82404cea" alt="album and camera" width=200px />
</p>

<h1 align="center"><a href="https://exif-frame.yuru.cam">EXIF Frame</a></h1>

<p align="center">
  📸 → 🖼️ with EXIF metadata
</p>

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.yurucam.exif"><img src="https://github.com/yurucam/exif-frame/assets/25793226/9be351a3-6c57-4033-a9e4-d95595a26dcd" width="200px" /></a>
  <a href="https://apps.apple.com/kr/app/exif-%ED%94%84%EB%A0%88%EC%9E%84/id6494989030"><img src="https://github.com/yurucam/exif-frame/assets/25793226/54f6d50f-e5f7-4b46-8bb0-5a646fce0dca" width="200px" /></a>
<p/>

<p align="center">
  <img src="https://github.com/yurucam/exif-frame/assets/25793226/9c992235-709b-46a6-9986-64f9bf7af288" width="400px" />
  <img src="https://github.com/yurucam/exif-frame/assets/25793226/415f3838-38f0-43c8-a5b2-55afa32b6659" width="400px" />
  <img src="https://github.com/yurucam/exif-frame/assets/25793226/55a28890-65bf-482a-a14c-8b9561532717" width="400px" />
  <img src="https://github.com/yurucam/exif-frame/assets/25793226/b8b60b55-665b-42b2-b9c6-d39109fd0777" width="400px" />
<p/>

[EXIF Frame](https://exif-frame.yuru.cam) is a web application that displays EXIF metadata in the frame by adding a border to the image. Users can process the uploaded image and download the result. You can also manually edit the EXIF metadata later.

---

## CLI (this fork)

A simple CLI script that renders EXIF frames using the same engine as the web app (real Chromium via Puppeteer, Barlow font, Canvas2D).

### Install

```bash
git clone git@github.com:nmd2k/exif-frame.git
cd exif-frame
npm install
```

Dependencies: [Node.js](https://nodejs.org/) ≥ 18, `exifreader`, `puppeteer` (bundles Chromium automatically).

### Usage

```bash
node cli/cli.mjs photo.jpg
node cli/cli.mjs -t one_line photo.jpg -o framed.jpg
node cli/cli.mjs -t strap --dark --artist "@username" photo.jpg
node cli/cli.mjs -t two_line --ratio 4:5 *.jpg -o ./framed/
```

### Themes

| Theme | Flags |
|-------|-------|
| `one_line` | `--template`, `--divider`, `--label`, `--text-align` |
| `two_line` | `--template1`, `--template2`, `--label` |
| `simple` | `--label` |
| `shot_on` | — |
| `strap` | `--dark`, `--artist`, `--template1-4` |
| `just_frame` | `--padding` |
| `no_frame` | — |

### All options

```
-t, --theme          Theme (default: one_line)
-o, --output         Output file or directory
-f, --format         jpg, png, webp
-q, --quality        1-100 (default: 95)
--ratio              free, 1:1, 4:5, 3:2, 16:9
--not-cropped        Keep full image
--bg-color           Background color hex
--text-color         Text color hex
--font-family        Font family (default: Barlow)
--font-size          Font size px (default: 70)
--font-weight        100-900 (default: 300)
--font-style         normal, italic
--padding            Uniform padding px
--padding-top/bottom/left/right
--padding-inside     Zero padding (text on image)
--label              Top label / watermark
--divider            Divider char (default: ∙)
--text-align         left, center, right
--template           Template for one_line
--template1-4        Templates for two_line/strap
--no-exposure        Hide exposure info
--dark               Dark mode (strap)
--artist             Artist credit (strap)
--secondary-font-weight  Weight for secondary text (strap)
```

Template variables: `{MAKER}` `{BODY}` `{LENS}` `{ISO}` `{MM}` `{F}` `{SEC}` `{TAKEN_AT}`

---

## Credits

Original project by [yurucam](https://github.com/yurucam/exif-frame) — web + mobile (iOS/Android) app.

### Contributors

Special thanks to all the people who have contributed:

- [rhea-so](https://github.com/rhea-so)
- [longfin](https://github.com/longfin)
- [KelvinPuyam](https://github.com/KelvinPuyam)
- [SJC08](https://github.com/SJC08)
