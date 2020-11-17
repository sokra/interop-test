const fs = require("fs");
const path = require("path");
const { formatTable, dedupeLines, transpose } = require("./helpers/tableUtils");

const root = path.resolve(__dirname, "../");
const resultsDir = path.resolve(root, "results");

const results = fs.readdirSync(resultsDir);

const headers = new Set();
const modules = new Set();
const allData = [];

for (const filename of results) {
  const data = JSON.parse(
    fs.readFileSync(path.resolve(resultsDir, filename), "utf-8")
  );
  allData.push([filename.slice(0, -5), data]);
  for (const header of data[0].slice(1)) {
    headers.add(header);
  }
  for (const [module] of data.slice(1)) {
    modules.add(module);
  }
}

let output = "";

for (const module of modules) {
  let results = [];
  results.push([module, ...headers]);
  for (const [name, data] of allData) {
    const line = data.find((line) => line[0] === module);
    if (line) {
      const resultLine = [name];
      for (const key of headers) {
        const idx = data[0].findIndex((header) => header === key);
        resultLine.push(idx < 0 ? "" : line[idx]);
      }
      results.push(resultLine);
    }
  }
  results = dedupeLines(results);
  results = transpose(results);
  results = dedupeLines(results);
  results = transpose(results);

  output += formatTable(results);
  output += `\n`;
}

console.log(output);
