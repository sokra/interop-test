const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const { formatTable, dedupeLines, transpose } = require("./tableUtils");

const root = path.resolve(__dirname, "../../");
const src = path.resolve(root, "src");
const resultsDir = path.resolve(root, "results");

const removeMjs = (data) => {
  const header = data[0];
  for (let i = 0; i < header.length; i++) {
    if (header[i].endsWith(" (mjs)")) header[i] = header[i].slice(0, -6);
  }
};

const print = (expr) =>
  `Promise.resolve().then(() => {}).then(() => console.log(util.inspect(${expr}, { showHidden: true, breakLength: Infinity, compact: true, getters: true })))`;

module.exports = async ({
  name,
  packages,
  setup,
  teardown,
  execute,
  onlyMjs,
}) => {
  try {
    let versions = [];

    if (packages) {
      childProcess.execSync(`yarn add ${packages.join(" ")}`, {
        stdio: "inherit",
      });

      versions = JSON.parse(
        childProcess.execSync(
          `yarn list ${packages
            .map((p) => p.replace(/@[\d.]+$/, ""))
            .join(" ")} --depth=0 --json`,
          {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
          }
        )
      ).data.trees.map((tree) => tree.name);
    }
    versions.push(`node@${process.version.slice(1)}`);

    if (setup) await setup();

    let total = 0;
    let results = [];

    try {
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
          )}; }).catch(err => { console.error(err); process.exitCode = 1; });`,
        ],
      ];

      const modules = fs
        .readdirSync(path.resolve(src, "../modules"))
        .filter((name) => {
          const arg = process.argv[2];
          return !arg || name.includes(arg);
        })
        .sort();

      {
        const header = ["module"];
        for (const [name] of syntaxCases("...")) {
          header.push(`\`${name}\` (mjs)`);
          if (!onlyMjs) {
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
            if (fs.rmSync) {
              fs.rmSync(path.resolve(root, "dist"), {
                recursive: true,
                force: true,
              });
              fs.rmSync(src, { recursive: true, force: true });
            } else {
              fs.rmdirSync(path.resolve(root, "dist"), { recursive: true });
              fs.rmdirSync(src, { recursive: true });
            }
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
              .replace(
                /\[Symbol\(Symbol\.toStringTag\)\]: 'Module'/g,
                "Module"
              );
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
        results.push([moduleName.replace(/\.m?js$/, ""), ...syntaxResults]);
      }
      process.stderr.write("\n");
    } finally {
      if (teardown) await teardown();
    }

    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(
      path.resolve(resultsDir, `${name}.json`),
      JSON.stringify(results, 0, 2)
    );

    if (onlyMjs) removeMjs(results);
    results = dedupeLines(results);
    results = transpose(results);
    results = dedupeLines(results);
    results = transpose(results);

    const output = formatTable(results);

    let readme = fs.readFileSync(path.resolve(root, "README.md"), "utf-8");
    readme = readme.replace(
      new RegExp(`<!-- ${name} results -->\\n\\n(Version:.+\n|\n|\\|.+\\n)+`),
      `<!-- ${name} results -->\n\nVersion: ${versions
        .map((v) => `\`${v}\``)
        .join(" ")}\n\n${output}\n`
    );
    fs.writeFileSync(path.resolve(root, "README.md"), readme);

    const data = require("../../package.json");
    delete data.dependencies;
    fs.writeFileSync(
      path.resolve(root, "package.json"),
      JSON.stringify(data, 0, 2)
    );
  } catch (err) {
    console.error(err);
  }
};
