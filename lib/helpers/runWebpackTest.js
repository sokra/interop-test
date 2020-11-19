const execNode = require("./execNode");
const runTest = require("./runTest");

module.exports = async (name, packages, ext) => {
  let webpack;
  await runTest({
    name,
    packages,
    ext,
    setup: () => (webpack = require("webpack")),
    execute: async (filename) => {
      return new Promise((resolve) =>
        webpack(
          {
            mode: "production",
            entry: `./src/${filename}`,
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
              execNode("dist/main.js") +
                (stats.hasWarnings() ? " + warnings" : "")
            );
          }
        )
      );
    },
  });
};
