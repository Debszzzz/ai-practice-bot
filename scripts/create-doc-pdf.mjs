import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const sourcePath = "docs/project-documentation.md";
const outputPath = "docs/AI-Practice-Bot-Documentation.pdf";

const escapePdfText = (value) => value
  .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
  .replace(/\\/g, "\\\\")
  .replace(/\(/g, "\\(")
  .replace(/\)/g, "\\)");

const normalizeMarkdown = (markdown) => markdown
  .replace(/^#{1,6}\s+/gm, "")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .replace(/\|/g, "  ")
  .replace(/---+/g, "")
  .split(/\r?\n/);

const wrapLine = (line, width = 92) => {
  const trimmed = line.trim();
  if (!trimmed) return [""];

  const words = trimmed.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
};

const toPages = (lines) => {
  const wrapped = lines.flatMap((line) => wrapLine(line));
  const pages = [];
  const pageSize = 52;

  for (let index = 0; index < wrapped.length; index += pageSize) {
    pages.push(wrapped.slice(index, index + pageSize));
  }

  return pages;
};

const buildPdf = (pages) => {
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];

  for (const pageLines of pages) {
    const streamLines = [
      "BT",
      "/F1 10 Tf",
      "14 TL",
      "50 780 Td",
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET",
    ];
    const stream = streamLines.join("\n");
    const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"));
    chunks.push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return chunks.join("");
};

const markdown = await readFile(sourcePath, "utf8");
const pages = toPages(normalizeMarkdown(markdown));
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, buildPdf(pages), "binary");
console.log(`Wrote ${outputPath}`);
