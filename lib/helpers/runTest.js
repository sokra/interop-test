const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const root = path.resolve(__dirname, "../../");
const src = path.resolve(root, "src");

const print = `(x => console.log(util.inspect(x, { showHidden: true, breakLength: Infinity, compact: true, getters: true })))`;

module.exports = async (execute, onlyMjs) => {
  const syntaxCases = (filename) => [
    ["import x", `import x from "${filename}"; ${print}(x);`],
    [
      "import { default as x }",
      `import { default as x } from "${filename}"; ${print}(x);`,
    ],
    [
      "import * as x; x.default",
      `import * as x from "${filename}"; ${print}(x.default);`,
    ],
    [
      "import * as x; ident(x).default",
      `import * as x from "${filename}"; ${print}(Object(x).default);`,
    ],
    [
      "import { named as x }",
      `import { named as x } from "${filename}"; ${print}(x);`,
    ],
    [
      "import * as x; x.named",
      `import * as x from "${filename}"; ${print}(x.named);`,
    ],
    [
      "import * as x; ident(x).named",
      `import * as x from "${filename}"; ${print}(Object(x).named);`,
    ],
    [
      "import { __esModule as x }",
      `import { __esModule as x } from "${filename}"; ${print}(x);`,
    ],
    [
      "import * as x; x.__esModule",
      `import * as x from "${filename}"; ${print}(x.__esModule);`,
    ],
    [
      "import * as x; ident(x).__esModule",
      `import * as x from "${filename}"; ${print}(Object(x).__esModule);`,
    ],
    ["import * as x", `import * as x from "${filename}"; ${print}(x);`],
    [
      "import()",
      `import("${filename}").then(x => { ${print}(x); }).catch(err => { console.log("reject"); });`,
    ],
  ];

  const modules = fs.readdirSync(path.resolve(src, "../modules")).sort();

  const results = [];

  let i = 0;
  const total = modules.length * syntaxCases("...").length;
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
      let result = await run("index.mjs");
      if (!onlyMjs) {
        const jsResult = await run("index.js");
        if (jsResult !== result) {
          result = `${result} (mjs)<br>${jsResult} (js)`;
        }
      }
      syntaxResults.push(result);
      i++;
      process.stderr.write(
        `${Math.round((i / total) * 100)}% (${i}/${total})  \r`
      );
    }
    results.push([moduleName.replace(".js", ""), ...syntaxResults]);
  }
  process.stderr.write("\n");

  const data = require("../../package.json");
  delete data.dependencies;
  fs.writeFileSync(
    path.resolve(root, "package.json"),
    JSON.stringify(data, 0, 2)
  );

  const header = ["module", ...syntaxCases("...").map((x) => "`" + x[0] + "`")];
  console.log(`| ${header.join(" | ")} |`);
  console.log(`| ${header.map(() => "---").join(" | ")} |`);
  for (const result of results) {
    console.log(`| ${result.join(" | ")} |`);
  }
};
