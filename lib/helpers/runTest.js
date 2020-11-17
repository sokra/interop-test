const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../");
const src = path.resolve(root, "src");
const resultsDir = path.resolve(root, "results");

const mergeJsMjs = (items) => {
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const item = items[i];
    if (
      prev.endsWith(" (mjs)") &&
      item.endsWith(" (js)") &&
      prev.slice(0, -6) === item.slice(0, -5)
    ) {
      items.splice(i - 1, 2, prev.slice(0, -6));
      i--;
    }
  }
};

const dedupeLines = (data) => {
  const headers = new Map();
  const lines = new Map();
  for (const line of data.slice(1)) {
    const header = line[0];
    const lineData = line.slice(1);
    const key = lineData.join("|");
    let list = headers.get(key);
    if (list === undefined) {
      list = [];
      headers.set(key, list);
      lines.set(key, lineData);
    }
    list.push(header);
  }
  const results = [data[0]];
  for (const [key, headerItems] of headers) {
    mergeJsMjs(headerItems);
    results.push([headerItems.join("<br><br>"), ...lines.get(key)]);
  }
  return results;
};

const transpose = (data) => {
  const length = data[0].length;
  const results = [];
  for (let i = 0; i < length; i++) {
    const resultLine = [];
    for (const line of data) {
      resultLine.push(line[i]);
    }
    results.push(resultLine);
  }
  return results;
};

const print = (expr) =>
  `Promise.resolve().then(() => {}).then(() => console.log(util.inspect(${expr}, { showHidden: true, breakLength: Infinity, compact: true, getters: true })))`;

module.exports = async (name, execute, onlyMjs) => {
  const syntaxCases = (filename) => [
    ["import x", `import x from "${filename}"; ${print("x")};`],
    [
      "import { default as x }",
      `import { default as x } from "${filename}"; ${print("x")};`,
    ],
    [
      "import * as x; x.default",
      `import * as x from "${filename}"; ${print("x.default")};`,
    ],
    [
      "import * as x; ident(x).default",
      `import * as x from "${filename}"; ${print("Object(x).default")};`,
    ],
    [
      "import { named as x }",
      `import { named as x } from "${filename}"; ${print("x")};`,
    ],
    [
      "import * as x; x.named",
      `import * as x from "${filename}"; ${print("x.named")};`,
    ],
    [
      "import * as x; ident(x).named",
      `import * as x from "${filename}"; ${print("Object(x).named")};`,
    ],
    [
      "import { __esModule as x }",
      `import { __esModule as x } from "${filename}"; ${print("x")};`,
    ],
    [
      "import * as x; x.__esModule",
      `import * as x from "${filename}"; ${print("x.__esModule")};`,
    ],
    [
      "import * as x; ident(x).__esModule",
      `import * as x from "${filename}"; ${print("Object(x).__esModule")};`,
    ],
    ["import * as x", `import * as x from "${filename}"; ${print("x")};`],
    [
      "import()",
      `import("${filename}").then(x => { ${print(
        "x"
      )}; }).catch(err => { console.log("reject"); });`,
    ],
  ];

  const modules = fs
    .readdirSync(path.resolve(src, "../modules"))
    .filter((name) => {
      const arg = process.argv[2];
      return !arg || name.includes(arg);
    })
    .sort();

  let total = 0;
  let results = [];
  {
    const header = ["module"];
    for (const [name] of syntaxCases("...")) {
      if (onlyMjs) {
        header.push(`\`${name}\``);
      } else {
        header.push(`\`${name}\` (mjs)`);
        header.push(`\`${name}\` (js)`);
      }
      total += modules.length;
    }
    results.push(header);
  }

  let i = 0;
  for (const moduleName of modules) {
    const syntaxResults = [];
    for (const [, content] of syntaxCases(`../modules/${moduleName}`)) {
      const run = async (testFilename) => {
        fs.rmSync(path.resolve(root, "dist"), { recursive: true, force: true });
        fs.rmSync(src, { recursive: true, force: true });
        fs.mkdirSync(src, { recursive: true });
        fs.writeFileSync(
          path.resolve(src, testFilename),
          (testFilename.endsWith(".mjs")
            ? 'import util from "util";\n'
            : 'const util = require("util");\n') +
            content +
            "\nexport {};"
        );
        let output = "??";
        try {
          output = await execute(testFilename);
        } catch (err) {
          output = "test error";
        }
        return output
          .replace(/\n/g, " ")
          .replace(/<Inspection threw \([^)]+\)>/g, "<Inspection threw>")
          .replace(/\[__esModule\]: true/g, "__esModule")
          .replace(/named: 'named'/g, "named")
          .replace(/\[named\]: 'named'/g, "[named]")
          .replace(/named: \[Getter: 'named'\]/g, "named: [G]")
          .replace(/a: 'a'/g, "a")
          .replace(/b: 'b'/g, "b")
          .replace(/c: 'c'/g, "c")
          .replace(/default: 'default'/g, "default")
          .replace(/\[default\]: 'default'/g, "[default]")
          .replace(/\[Getter([:\]])/g, "[G$1")
          .replace(/\[Symbol\(Symbol\.toStringTag\)\]: 'Module'/g, "Module");
      };
      syntaxResults.push(await run("index.mjs"));
      if (!onlyMjs) {
        syntaxResults.push(await run("index.js"));
      }
      i++;
      process.stderr.write(
        `${Math.round((i / total) * 100)}% (${i}/${total})  \r`
      );
    }
    results.push([moduleName.replace(".js", ""), ...syntaxResults]);
  }
  process.stderr.write("\n");

  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(
    path.resolve(resultsDir, `${name}.json`),
    JSON.stringify(results, 0, 2)
  );

  const data = require("../../package.json");
  delete data.dependencies;
  fs.writeFileSync(
    path.resolve(root, "package.json"),
    JSON.stringify(data, 0, 2)
  );

  results = dedupeLines(results);
  results = transpose(results);
  results = dedupeLines(results);
  results = transpose(results);

  const header = results.shift();
  console.log(`| ${header.join(" | ")} |`);
  console.log(`| ${header.map(() => "---").join(" | ")} |`);
  for (const result of results) {
    console.log(`| ${result.join(" | ")} |`);
  }
};
