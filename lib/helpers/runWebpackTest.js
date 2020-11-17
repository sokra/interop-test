const childProcess = require("child_process");
const runTest = require("./runTest");

module.exports = async () => {
  const webpack = require("webpack");
  await runTest(async (filename) => {
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
          try {
            return resolve(
              "`" +
                childProcess
                  .execSync(`node dist/main.js`, {
                    encoding: "utf-8",
                    stdio: ["ignore", "pipe", "ignore"],
                  })
                  .trim() +
                "`" +
                (stats.hasWarnings() ? " + warnings" : "")
            );
          } catch (err) {
            resolve("runtime error");
          }
        }
      )
    );
  });
};
