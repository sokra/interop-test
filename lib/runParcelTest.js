const path = require("path");
const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

let Parcel;
runTest({
  name: "parcel",
  packages: [
    "@parcel/core@2.0.0-alpha.3",
    "@parcel/config-default@2.0.0-alpha.3",
  ],
  setup: () => (Parcel = require("@parcel/core").default),
  execute: (filename) =>
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
        return execNode("dist/index.js") + (hasWarnings ? " + warnings" : "");
      })(),
      new Promise((resolve) =>
        setTimeout(() => resolve("timeout error"), 10000)
      ),
    ]),
});
