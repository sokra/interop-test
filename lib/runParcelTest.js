const path = require("path");
const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

let queue = undefined;
const acquire = () => {
  if (queue) {
    return new Promise((resolve) => queue.push(resolve));
  } else {
    queue = [];
    return Promise.resolve();
  }
};
const release = () => {
  if (queue.length) {
    queue.shift()();
  } else {
    queue = undefined;
  }
};

let parcel;
let workerFarm;
runTest({
  name: "parcel",
  packages: ["@parcel/core", "@parcel/config-default"],
  setup: () => {
    parcel = require("@parcel/core");
    workerFarm = parcel.createWorkerFarm({
      maxConcurrentWorkers: 0,
    });
  },
  execute: async (filename, idx) => {
    await acquire();
    return await Promise.race([
      (async () => {
        let hasWarnings = false;
        try {
          let bundler = new parcel.Parcel({
            entries: path.resolve(__dirname, `../src/${filename}`),
            defaultConfig: require.resolve("@parcel/config-default"),
            workerFarm,
            logLevel: "warn",
            targets: {
              default: {
                distDir: `dist/${idx}`,
                distEntry: `index.js`,
                context: "node",
                sourceMap: false,
              },
            },
            shouldDisableCache: true,
            cacheDir: `dist/cache-${idx}`,
            mode: "production",
            patchConsole: false,
          });

          await bundler.run();
        } catch (err) {
          console.log(err);
          return "compilation error";
        } finally {
          release();
        }
        return (
          (await execNode(`dist/${idx}/index.js`)) +
          (hasWarnings ? " + warnings" : "")
        );
      })(),
      new Promise((resolve) =>
        setTimeout(() => resolve("timeout error"), 10000)
      ),
    ]);
  },
});
