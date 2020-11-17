const childProcess = require("child_process");
const path = require("path");
const runTest = require("./helpers/runTest");
childProcess.execSync(
  `yarn add @parcel/core@2.0.0-alpha.3 @parcel/config-default@2.0.0-alpha.3`,
  {
    stdio: "inherit",
  }
);

const Parcel = require("@parcel/core").default;
runTest("parcel", (filename) =>
  Promise.race([
    (async () => {
      let hasWarnings = false;
      try {
        let bundler = new Parcel({
          entries: path.resolve(__dirname, `../src/${filename}`),
          defaultConfig: {
            filePath: require.resolve("@parcel/config-default"),
          },
          defaultEngines: {
            node: "14",
          },
          distDir: path.resolve(__dirname, "../dist"),
          mode: "production",
        });

        await bundler.run();
      } catch (err) {
        console.log(err);
        return "compilation error";
      }
      try {
        return (
          "`" +
          childProcess
            .execSync(`node dist/index.js`, {
              encoding: "utf-8",
              stdio: ["ignore", "pipe", "ignore"],
            })
            .trim() +
          "`" +
          (hasWarnings ? " + warnings" : "")
        );
      } catch (err) {
        return "runtime error";
      }
    })(),
    new Promise((resolve) => setTimeout(() => resolve("timeout error"), 10000)),
  ])
).catch((err) => console.error(err));
