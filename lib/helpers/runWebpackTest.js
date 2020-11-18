const execNode = require("./execNode");
const runTest = require("./runTest");

module.exports = async (name) => {
  const webpack = require("webpack");
  await runTest(name, async (filename) => {
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
          return (
            execNode("dist/main.js") +
            (stats.hasWarnings() ? " + warnings" : "")
          );
        }
      )
    );
  });
};
