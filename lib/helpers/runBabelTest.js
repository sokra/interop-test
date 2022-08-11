const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const runTest = require("./runTest");
const execNode = require("./execNode");

module.exports = async (name, sourceType, ext) => {
  let babel;
  await runTest({
    name,
    packages: [
      "@babel/cli",
      "@babel/core",
      "@babel/plugin-transform-modules-commonjs",
      "babel-plugin-dynamic-import-node",
    ],
    ext,
    setup: () => {
      babel = require("@babel/core");
      fs.mkdirSync(path.resolve(__dirname, "../../dist/src"), {
        recursive: true,
      });
      childProcess.execSync(
        `yarn babel modules -d dist/modules --plugins=@babel/plugin-transform-modules-commonjs --plugins=babel-plugin-dynamic-import-node --source-type=${sourceType}`,
        {
          stdio: "inherit",
        }
      );
    },
    execute: async (filename, idx) => {
      let hasWarnings = false;
      try {
        const transformed = await babel.transformFileAsync(
          path.resolve(__dirname, `../../src/${filename}`),
          {
            plugins: [
              "@babel/plugin-transform-modules-commonjs",
              "babel-plugin-dynamic-import-node",
            ],
            sourceType,
          }
        );
        fs.writeFileSync(
          path.resolve(__dirname, `../../dist/src/${idx}.js`),
          transformed.code.replace(/\.mjs/g, ".js")
        );
      } catch (err) {
        console.log(err);
        return "compilation error";
      }
      return (
        (await execNode(`dist/src/${idx}.js`)) +
        (hasWarnings ? " + warnings" : "")
      );
    },
  });
};
