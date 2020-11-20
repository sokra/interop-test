const fs = require("fs");
const path = require("path");
const {
  formatTable,
  dedupeLines,
  transpose,
  markOutlinersInLine,
  comparator,
  removeIdenticalLines,
  swapColumns,
  splitCombinedHeader,
} = require("./helpers/tableUtils");

const root = path.resolve(__dirname, "../");
const resultsDir = path.resolve(root, "results");

const results = fs.readdirSync(resultsDir).sort(comparator);

const headers = new Set();
let modules = new Set();
const allData = [];
const allDataTransposed = [];

for (const filename of results) {
  const data = JSON.parse(
    fs.readFileSync(path.resolve(resultsDir, filename), "utf-8")
  );
  allData.push([filename.slice(0, -5), data]);
  allDataTransposed.push([filename.slice(0, -5), transpose(data)]);
  for (const header of data[0].slice(1)) {
    headers.add(header);
  }
  for (const [module] of data.slice(1)) {
    modules.add(module);
  }
}

modules = new Set(Array.from(modules).sort(comparator));

let outputModule = "";
let outputSyntax = "";

for (const module of modules) {
  let results = [];
  results.push([module, ...headers]);
  for (const [name, data] of allData) {
    const line = data.find((line) => line[0] === module);
    if (line) {
      const resultLine = [name];
      for (const key of headers) {
        const idx = data[0].findIndex((header) => header === key);
        resultLine.push(idx < 0 ? "no results" : line[idx]);
      }
      results.push(resultLine);
    }
  }
  results = transpose(results);
  markOutlinersInLine(results);
  results = dedupeLines(results);
  results = transpose(results);
  results = dedupeLines(results);
  results = transpose(results);

  outputModule += `### ${module}\n\n`;
  outputModule += formatTable(results);
  outputModule += `\n`;
}

for (const header of headers) {
  let results = [];
  results.push([header, ...modules]);
  for (const [name, data] of allDataTransposed) {
    const line = data.find((line) => line[0] === header);
    if (line) {
      const resultLine = [name];
      for (const key of modules) {
        const idx = data[0].findIndex((module) => module === key);
        resultLine.push(idx < 0 ? "no results" : line[idx]);
      }
      results.push(resultLine);
    }
  }
  results = transpose(results);
  markOutlinersInLine(results);
  results = dedupeLines(results);
  results = transpose(results);
  results = dedupeLines(results);
  results = transpose(results);

  outputSyntax += `### ${header}\n\n`;
  outputSyntax += formatTable(results);
  outputSyntax += `\n`;
}

let readme = fs.readFileSync(path.resolve(root, "README.md"), "utf-8");
readme = readme.replace(
  /<!-- module results -->\n\n(### .+\n|\n|\|.+\n)+/,
  `<!-- module results -->\n\n${outputModule}`
);
readme = readme.replace(
  /<!-- syntax results -->\n\n(### .+\n|\n|\|.+\n)+/,
  `<!-- syntax results -->\n\n${outputSyntax}`
);

const diffs = [
  ["webpack", "node"],
  ["babel", "node"],
  ["babel", "babel-js"],
  ["webpack", "webpack-js"],
];
const excludeHeadersInDiff = new Set(["`import * as x`", "`import()`"]);

for (const diff of diffs) {
  const name = `${diff.join("-")}`;
  let results = [[`fixture<br>${name}`, ...diff]];

  const diffData = diff.map((tool) => allData.find(([t]) => t === tool));
  for (const header of headers) {
    if (excludeHeadersInDiff.has(header)) continue;
    for (const module of modules) {
      const key = `${module}<br>${header}`;
      const line = [key];
      for (const [, data] of diffData) {
        const index = data[0].indexOf(header);
        const dataLine = data.find((line) => line[0] === module);
        line.push(dataLine && index > 0 ? dataLine[index] : "no results");
      }
      results.push(line);
    }
  }

  results = removeIdenticalLines(results);
  results = splitCombinedHeader(results, "syntax");
  results = dedupeLines(results);
  results = swapColumns(results, 0, 1);
  results = dedupeLines(results);

  let output = "";
  output += formatTable(results);
  output += `\n`;

  readme = readme.replace(
    new RegExp(`<!-- diff-${name} results -->\\n\\n(\\n|\\|.+\\n)+`),
    `<!-- diff-${name} results -->\n\n${output}`
  );
}
fs.writeFileSync(path.resolve(root, "README.md"), readme);
