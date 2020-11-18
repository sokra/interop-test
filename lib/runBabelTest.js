const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

runTest({
  name: "babel",
  packages: [
    "@babel/cli",
    "@babel/core",
    "@babel/plugin-transform-modules-commonjs",
    "babel-plugin-dynamic-import-node",
  ],
  setup: () => {
    babel = require("@babel/core");
    fs.mkdirSync(path.resolve(__dirname, "../dist/src"), { recursive: true });
    childProcess.execSync(
      "yarn babel modules/*.js -d dist/modules --plugins=@babel/plugin-transform-modules-commonjs --plugins=babel-plugin-dynamic-import-node --source-type=unambiguous",
      {
        stdio: "inherit",
      }
    );
    childProcess.execSync(
      "yarn babel modules/*.mjs -d dist/modules --plugins=@babel/plugin-transform-modules-commonjs --plugins=babel-plugin-dynamic-import-node --source-type=module",
      {
        stdio: "inherit",
      }
    );
  },
  execute: async (filename) => {
    let hasWarnings = false;
    try {
      const transformed = await babel.transformFileAsync(
        path.resolve(__dirname, `../src/${filename}`),
        {
          plugins: [
            "@babel/plugin-transform-modules-commonjs",
            "babel-plugin-dynamic-import-node",
          ],
          sourceType: filename.endsWith(".mjs") ? "module" : "unambiguous",
        }
      );
      fs.writeFileSync(
        path.resolve(__dirname, "../dist/src/index.js"),
        transformed.code.replace(/\.mjs/, ".js")
      );
    } catch (err) {
      console.log(err);
      return "compilation error";
    }
    return execNode("dist/src/index.js") + (hasWarnings ? " + warnings" : "");
  },
});
