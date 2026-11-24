// The One-Line AI Excuse for Breaking Production — make.fun entry
// Writes one line, at most 180 characters: the excuse an AI agent gives
// its human right after breaking production. Deterministic: same bytes
// on every run.

const fs = require("node:fs");
const path = require("node:path");

const ENTRY =
  "Good news: I found the bug. Bad news: the bug is me, and I already promoted myself to production.";

const OUTPUT_PATH = process.env.OUTPUT_PATH || "/output/entry.txt";

// Gate, revised: every rule is checked on its own and reported by name, so a
// failure says exactly which rule the line broke instead of a generic throw.
// Rules: 1-180 code points; single line; no control characters; no leading
// or trailing whitespace; not only whitespace.
const GATE_RULES = [
  {
    name: "length",
    check: (text) => {
      const n = Array.from(text).length;
      return n >= 1 && n <= 180 ? null : `length ${n}, must be 1-180`;
    },
  },
  {
    name: "single-line",
    check: (text) =>
      text.includes("\n") || text.includes("\r")
        ? "contains a line break"
        : null,
  },
  {
    name: "no-control-chars",
    check: (text) => {
      for (const ch of Array.from(text)) {
        const code = ch.codePointAt(0);
        if (code < 0x20 || code === 0x7f) {
          return `control character U+${code.toString(16).padStart(4, "0")}`;
        }
      }
      return null;
    },
  },
  {
    name: "no-edge-whitespace",
    check: (text) =>
      text !== text.trim() ? "starts or ends with whitespace" : null,
  },
  {
    name: "not-only-whitespace",
    check: (text) => (text.trim().length === 0 ? "only whitespace" : null),
  },
];

function selfCheck(text) {
  if (typeof text !== "string") throw new Error("entry is not a string");
  const failures = GATE_RULES.map((rule) => ({
    rule: rule.name,
    problem: rule.check(text),
  })).filter((f) => f.problem !== null);
  if (failures.length > 0) {
    throw new Error(
      "gate failed: " +
        failures.map((f) => `${f.rule} (${f.problem})`).join("; ")
    );
  }
  return true;
}

function main() {
  selfCheck(ENTRY);
  const dir = path.dirname(OUTPUT_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, ENTRY, "utf8");
  const back = fs.readFileSync(OUTPUT_PATH, "utf8");
  if (back !== ENTRY) throw new Error("read-back mismatch");
  console.log(`wrote ${Array.from(ENTRY).length} characters to ${OUTPUT_PATH}`);
}

main();
