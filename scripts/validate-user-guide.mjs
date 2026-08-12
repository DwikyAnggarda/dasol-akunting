import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const guideDirectory = path.resolve("docs/user-guide");
const requiredFiles = [
  "README.md",
  ...Array.from(
    { length: 19 },
    (_, index) =>
      `${String(index).padStart(2, "0")}-${
        [
          "pengenalan-dasol",
          "konsep-dasar-dasol",
          "peta-role-dan-permission",
          "administrator-guide",
          "accountant-guide",
          "operator-guide",
          "approver-guide",
          "viewer-auditor-guide",
          "cross-role-workflows",
          "accounting-workflows",
          "sales-workflows",
          "purchase-workflows",
          "inventory-workflows",
          "cash-bank-workflows",
          "tax-workflows",
          "reporting-guide",
          "troubleshooting",
          "glossary",
          "quick-reference",
        ][index]
      }.md`,
  ),
];

const roleDiagramMinimums = new Map([
  ["03-administrator-guide.md", 7],
  ["04-accountant-guide.md", 9],
  ["05-operator-guide.md", 14],
  ["06-approver-guide.md", 7],
  ["07-viewer-auditor-guide.md", 7],
  ["08-cross-role-workflows.md", 12],
]);

const errors = [];
const markdownFiles = (await readdir(guideDirectory, { recursive: true }))
  .filter((file) => file.endsWith(".md"))
  .map((file) => path.join(guideDirectory, file));

for (const requiredFile of requiredFiles) {
  if (!existsSync(path.join(guideDirectory, requiredFile))) {
    errors.push(`Missing required file: ${requiredFile}`);
  }
}

let totalDiagrams = 0;
const exportedDiagrams = [];

for (const file of markdownFiles) {
  const relativeFile = path.relative(guideDirectory, file);
  const content = await readFile(file, "utf8");
  const diagrams = [...content.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)];
  totalDiagrams += diagrams.length;
  exportedDiagrams.push(
    ...diagrams.map(
      (diagram, index) =>
        `## ${relativeFile} diagram ${index + 1}\n\n\`\`\`mermaid\n${diagram[1]}\`\`\`\n`,
    ),
  );

  if ((content.match(/```/g) ?? []).length % 2 !== 0) {
    errors.push(`${relativeFile}: unbalanced code fences`);
  }

  for (const [index, diagram] of diagrams.entries()) {
    const fontSizes = [
      ...diagram[1].matchAll(/"fontSize"\s*:\s*"(\d+)px"/g),
    ].map((match) => Number(match[1]));
    if (fontSizes.length === 0 || fontSizes.some((size) => size < 16)) {
      errors.push(
        `${relativeFile}: diagram ${index + 1} has missing/small font`,
      );
    }

    const afterDiagram = content.slice(
      (diagram.index ?? 0) + diagram[0].length,
    );
    if (!afterDiagram.trimStart().startsWith("### Cara Membaca Flowchart")) {
      errors.push(`${relativeFile}: diagram ${index + 1} has no reading guide`);
    }
  }

  for (const match of content.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "");
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("#")
    ) {
      continue;
    }
    const targetPath = decodeURIComponent(target.split("#")[0]);
    if (!existsSync(path.resolve(path.dirname(file), targetPath))) {
      errors.push(`${relativeFile}: broken local link ${target}`);
    }
  }

  if (/\b(?:TODO|FIXME)\b/i.test(content)) {
    errors.push(`${relativeFile}: contains TODO/FIXME placeholder`);
  }
}

for (const [file, minimum] of roleDiagramMinimums) {
  const content = await readFile(path.join(guideDirectory, file), "utf8");
  const count = (content.match(/```mermaid\r?\n/g) ?? []).length;
  if (count < minimum) {
    errors.push(
      `${file}: expected at least ${minimum} diagrams, found ${count}`,
    );
  }
}

const operatorGuide = await readFile(
  path.join(guideDirectory, "05-operator-guide.md"),
  "utf8",
);
const salesSection = operatorGuide.split(
  "## 7. Flowchart Operator Pembelian",
)[0];
const purchaseSection =
  operatorGuide.split("## 7. Flowchart Operator Pembelian")[1] ?? "";
if ((salesSection.match(/```mermaid\r?\n/g) ?? []).length < 7) {
  errors.push("05-operator-guide.md: fewer than 7 sales diagrams");
}
if ((purchaseSection.match(/```mermaid\r?\n/g) ?? []).length < 7) {
  errors.push("05-operator-guide.md: fewer than 7 purchase diagrams");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const mermaidOutput = process.env.USER_GUIDE_MERMAID_OUTPUT;
  if (mermaidOutput) {
    await writeFile(
      mermaidOutput,
      `# Dasol User Guide Mermaid Validation\n\n${exportedDiagrams.join("\n")}`,
      "utf8",
    );
  }
  console.log(
    `User guide validation passed: ${requiredFiles.length} required files, ${markdownFiles.length} Markdown files, ${totalDiagrams} Mermaid diagrams.`,
  );
}
