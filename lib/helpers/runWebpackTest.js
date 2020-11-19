const path = require("path");
const execNode = require("./execNode");
const runTest = require("./runTest");

module.exports = async (name, packages, ext) => {
  let webpack;
  await runTest({
    name,
    packages,
    ext,
    setup: () => (webpack = require("webpack")),
    execute: async (filename, idx) => {
      return new Promise((resolve) =>
        webpack(
          {
            mode: "production",
            entry: `./src/${filename}`,
            output: {
              path: path.resolve(__dirname, `../../dist/${idx}`),
            },
            target: "node",
            optimization: {
              minimize: false,
            },
          },
          (err, stats) => {
            if (err) return resolve("fatal error");
            if (stats.hasErrors()) {
              return resolve("compilation error");
            }
            resolve(
              (async () => {
                return (
                  (await execNode(`dist/${idx}/main.js`)) +
                  (stats.hasWarnings() ? " + warnings" : "")
                );
              })()
            );
          }
        )
      );
    },
  });
};
