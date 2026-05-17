const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGET_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".json",
  ".md",
]);

const REPLACEMENTS = [
  ["", ""],
  ["", ""],
  ["Record", "Record"],
  ["GPS", "GPS"],
  ["✓", "✓"],
  ["->", "->"],
  ["Redo", "Redo"],
  ["-", "-"],
  ["-", "-"],
  ["·", "·"],
  ["°", "°"],
  ["±", "±"],
  ["²", "²"],
  ["x", "x"],
  ["≈", "≈"],
  ["θ", "θ"],
  ["-", "-"],
  ["₂", "₂"],
  ["Stop", "Stop"],
  ["", ""],
  ["Start", "Start"],
  ["", ""],
  ["", ""],
];

const shouldSkipDir = (name) =>
  name === "node_modules" ||
  name === ".git" ||
  name === ".expo" ||
  name === "assets";

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDir(entry.name)) walk(fullPath);
      continue;
    }

    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) continue;
    let text = fs.readFileSync(fullPath, "utf8");
    const original = text;
    for (const [bad, good] of REPLACEMENTS) {
      text = text.split(bad).join(good);
    }
    text = text.replace(/\u0000/g, "");
    if (text !== original) {
      fs.writeFileSync(fullPath, text, "utf8");
      console.log(path.relative(ROOT, fullPath));
    }
  }
}

walk(ROOT);
