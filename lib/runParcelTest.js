const path = require("path");
const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

let Parcel, workerFarm;
runTest({
  name: "parcel",
  packages: [
    "@parcel/core@2.0.0-nightly.628",
    "@parcel/config-default@2.0.0-nightly.630",
  ],
  setup: () => {
    Parcel = require("@parcel/core").default;
    workerFarm = require("@parcel/core").createWorkerFarm({
      maxConcurrentWorkers: 0,
    });
  },
  execute: (filename, idx) =>
    Promise.race([
      (async () => {
        let hasWarnings = false;
        try {
          let bundler = new Parcel({
            entries: `src/${filename}`,
            defaultConfig: require.resolve("@parcel/config-default"),
            workerFarm,
            logLevel: "warn",
            targets: {
              default: {
                distDir: "dist/",
                distEntry: `${idx}index.js`,
                context: "node",
                sourceMap: false,
              },
            },
            mode: "production",
            patchConsole: false,
          });

          await bundler.run();
        } catch (err) {
          console.log(err);
          return "compilation error";
        }
        return (
          (await execNode(`dist/${idx}index.js`)) +
          (hasWarnings ? " + warnings" : "")
        );
      })(),
      new Promise((resolve) =>
        setTimeout(() => resolve("timeout error"), 10000)
      ),
    ]),
}).then(() => workerFarm.end());
