#!/usr/bin/env node
/**
 * EXIF Frame CLI
 *
 * Uses a real browser (Chromium via Puppeteer) to render EXIF frames
 * with the exact same Barlow font, Canvas2D engine, and rendering code
 * as the web app. Zero fidelity loss.
 *
 * Usage:
 *   node cli/cli.mjs photo.jpg
 *   node cli/cli.mjs -t one_line photo.jpg -o framed.jpg
 *   node cli/cli.mjs -t strap --dark photo.jpg
 *   node cli/cli.mjs -t two_line --ratio 4:5 *.jpg -o ./framed/
 */

import puppeteer from "puppeteer";
import exifreader from "exifreader";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDER_HTML = path.join(__dirname, "render.html");

// ── EXIF extraction ──────────────────────────────────────────────────────────

async function readExif(filePath) {
  const buffer = fs.readFileSync(filePath);
  const tags = await exifreader.load(buffer);

  const make = tags.Make?.description || "";
  const model = tags.Model?.description || "";
  let lensModel = tags.LensModel?.description || "";
  if (model && lensModel.startsWith(model)) {
    lensModel = lensModel.slice(model.length).trim();
  }

  const focalLengthRaw = tags.FocalLength?.description || "";
  const focalLength = focalLengthRaw.replace(" mm", "mm");

  const fNumberRaw = tags.FNumber?.description || "";
  const fNumber = fNumberRaw.replace("f/", "F").substring(0, 5);

  const isoVal = tags.ISOSpeedRatings?.value;
  const iso = isoVal != null ? `ISO${isoVal}` : "";

  const exposureRaw = tags.ExposureTime?.description || "";
  const exposureTime = exposureRaw ? `${exposureRaw}s` : "";

  let takenAt = "";
  const dt = tags.DateTimeOriginal?.description;
  if (dt) {
    const parts = dt.replace(" ", ":").split(":");
    if (parts.length >= 6) {
      takenAt = `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
    }
  }

  return { make, model, lensModel, focalLength, fNumber, iso, exposureTime, takenAt };
}

// ── Browser + Render ─────────────────────────────────────────────────────────

let _browser = null;

async function getBrowser() {
  if (!_browser) {
    _browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });
  }
  return _browser;
}

async function renderInBrowser({ imagePath, exif, theme, format, quality, ...opts }) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Read image as base64
    const imgBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeMap = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
    const mime = mimeMap[ext] || "image/jpeg";
    const imageBase64 = `data:${mime};base64,${imgBuffer.toString("base64")}`;

    // Navigate to render page
    await page.goto(`file://${RENDER_HTML}`, { waitUntil: "networkidle0" });

    // Call render
    const params = {
      imageBase64,
      exif,
      theme,
      format: format || "jpg",
      quality: quality || 95,
      ...opts,
    };

    const dataUrl = await page.evaluate(async (p) => {
      return await window.__RENDER(p);
    }, params);

    return dataUrl;
  } finally {
    await page.close();
  }
}

// ── CLI Argument Parsing ─────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    input: [],
    output: null,
    format: null,
    theme: "one_line",
    ratio: "free",
    notCropped: false,
    backgroundColor: null,
    textColor: null,
    fontFamily: null,
    fontStyle: null,
    fontWeight: null,
    fontSize: null,
    padding: null,
    paddingTop: null,
    paddingBottom: null,
    paddingLeft: null,
    paddingRight: null,
    paddingInside: false,
    label: null,
    divider: null,
    textAlign: null,
    template: null,
    template1: null,
    template2: null,
    template3: null,
    template4: null,
    showExposure: true,
    darkMode: false,
    artist: null,
    secondaryFontWeight: null,
    quality: 95,
    help: false,
  };

  let i = 2;
  while (i < argv.length) {
    const a = argv[i];
    switch (a) {
      case "-h": case "--help": args.help = true; break;
      case "-o": case "--output": args.output = argv[++i]; break;
      case "-f": case "--format": args.format = argv[++i]; break;
      case "-t": case "--theme": args.theme = argv[++i]; break;
      case "--ratio": args.ratio = argv[++i]; break;
      case "--not-cropped": args.notCropped = true; break;
      case "--bg-color": args.backgroundColor = argv[++i]; break;
      case "--text-color": args.textColor = argv[++i]; break;
      case "--font-family": args.fontFamily = argv[++i]; break;
      case "--font-style": args.fontStyle = argv[++i]; break;
      case "--font-weight": args.fontWeight = Number(argv[++i]); break;
      case "--font-size": args.fontSize = Number(argv[++i]); break;
      case "--padding": args.padding = Number(argv[++i]); break;
      case "--padding-top": args.paddingTop = Number(argv[++i]); break;
      case "--padding-bottom": args.paddingBottom = Number(argv[++i]); break;
      case "--padding-left": args.paddingLeft = Number(argv[++i]); break;
      case "--padding-right": args.paddingRight = Number(argv[++i]); break;
      case "--padding-inside": args.paddingInside = true; break;
      case "--label": args.label = argv[++i]; break;
      case "--divider": args.divider = argv[++i]; break;
      case "--text-align": args.textAlign = argv[++i]; break;
      case "--template": args.template = argv[++i]; break;
      case "--template1": args.template1 = argv[++i]; break;
      case "--template2": args.template2 = argv[++i]; break;
      case "--template3": args.template3 = argv[++i]; break;
      case "--template4": args.template4 = argv[++i]; break;
      case "--no-exposure": args.showExposure = false; break;
      case "--dark": args.darkMode = true; break;
      case "--artist": args.artist = argv[++i]; break;
      case "--secondary-font-weight": args.secondaryFontWeight = Number(argv[++i]); break;
      case "-q": case "--quality": args.quality = Number(argv[++i]); break;
      default:
        if (!a.startsWith("-")) args.input.push(a);
        else { console.error(`Unknown option: ${a}`); process.exit(1); }
    }
    i++;
  }

  return args;
}

function printHelp() {
  console.log(`
EXIF Frame CLI — Add EXIF metadata frames to your photos.
Uses real browser rendering = exact same output as the web app.

Usage:
  node cli/cli.mjs [options] <input...>

Options:
  -o, --output <path>       Output file or directory (for batch)
  -f, --format <fmt>        Output format: jpg, jpeg, png, webp
  -t, --theme <name>        one_line, two_line, simple, shot_on, strap, just_frame, no_frame
  --ratio <ratio>           Aspect ratio: free, 1:1, 4:5, 3:2, 16:9
  --not-cropped             Keep full image, don't crop

Style:
  --bg-color <hex>          Background color
  --text-color <hex>        Text color
  --font-family <name>      Font family (default: Barlow)
  --font-style <style>      normal, italic
  --font-weight <num>       100-900
  --font-size <px>          Font size in px
  --padding <px>            Uniform padding
  --padding-top/bottom/left/right <px>

Text:
  --label <text>            Top label
  --divider <char>          Divider between EXIF fields
  --text-align <align>      left, center, right
  --template <str>          Template for one_line
  --template1-4 <str>       Templates for two_line/strap
  --no-exposure             Hide exposure info

Strap theme:
  --dark                    Dark mode
  --artist <name>           Artist credit
  --secondary-font-weight   Weight for secondary text

Output:
  -q, --quality <1-100>     JPEG/WebP quality (default: 95)

Template variables: {MAKER} {BODY} {LENS} {ISO} {MM} {F} {SEC} {TAKEN_AT}

Examples:
  node cli/cli.mjs photo.jpg
  node cli/cli.mjs -t strap --dark photo.jpg
  node cli/cli.mjs -t two_line --ratio 4:5 *.jpg -o ./framed/
`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (args.help || args.input.length === 0) {
    printHelp();
    process.exit(args.input.length === 0 ? 1 : 0);
  }

  const VALID_THEMES = ["no_frame", "just_frame", "one_line", "two_line", "simple", "shot_on", "strap"];
  if (!VALID_THEMES.includes(args.theme)) {
    console.error(`Unknown theme: ${args.theme}. Valid: ${VALID_THEMES.join(", ")}`);
    process.exit(1);
  }

  // Collect input files
  const inputFiles = [];
  for (const pattern of args.input) {
    if (fs.existsSync(pattern) && fs.statSync(pattern).isFile()) {
      inputFiles.push(pattern);
    } else if (pattern.includes("*") || pattern.includes("?")) {
      const dir = path.dirname(pattern) || ".";
      const base = path.basename(pattern);
      const regex = new RegExp("^" + base.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
      try {
        for (const f of fs.readdirSync(dir)) {
          if (regex.test(f)) {
            const fp = path.join(dir, f);
            if (fs.statSync(fp).isFile()) inputFiles.push(fp);
          }
        }
      } catch (e) {
        console.error(`Warning: cannot read ${dir}: ${e.message}`);
      }
    }
  }

  if (inputFiles.length === 0) {
    console.error("Error: No input files found.");
    process.exit(1);
  }

  const isBatch = inputFiles.length > 1;
  let singleOutput = null;
  let batchDir = null;

  if (args.output) {
    if (isBatch) {
      batchDir = args.output;
      fs.mkdirSync(batchDir, { recursive: true });
    } else {
      singleOutput = args.output;
    }
  } else {
    if (isBatch) {
      batchDir = "./framed";
      fs.mkdirSync(batchDir, { recursive: true });
    } else {
      const p = path.parse(inputFiles[0]);
      singleOutput = path.join(p.dir, `${p.name}_framed${p.ext}`);
    }
  }

  // Build opts, omitting null/undefined values
  const opts = {};
  for (const [k, v] of Object.entries(args)) {
    if (v != null && !["input", "output", "help"].includes(k)) {
      opts[k] = v;
    }
  }

  // Map --padding to per-side padding
  if (opts.padding != null) {
    opts.paddingTop = opts.padding;
    opts.paddingBottom = opts.padding;
    opts.paddingLeft = opts.padding;
    opts.paddingRight = opts.padding;
    delete opts.padding;
  }

  console.error(`Launching browser...`);

  for (const imgPath of inputFiles) {
    try {
      const exif = await readExif(imgPath);

      const dataUrl = await renderInBrowser({
        imagePath: imgPath,
        exif,
        ...opts,
      });

      // Determine output path
      let outPath;
      if (batchDir) {
        const p = path.parse(imgPath);
        const ext = args.format ? `.${args.format}` : p.ext;
        outPath = path.join(batchDir, `${p.name}${ext}`);
      } else {
        outPath = singleOutput;
      }

      // Decode and save
      const dir = path.dirname(outPath);
      if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });

      const base64Data = dataUrl.split(",")[1];
      fs.writeFileSync(outPath, Buffer.from(base64Data, "base64"));

      console.log(`${imgPath} -> ${outPath}`);
    } catch (e) {
      console.error(`Error processing ${imgPath}: ${e.message}`);
    }
  }

  if (_browser) await _browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
