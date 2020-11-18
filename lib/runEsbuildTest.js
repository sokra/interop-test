const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

let service;
runTest({
  name: "esbuild",
  packages: ["esbuild"],
  setup: async () => (service = await require("esbuild").startService()),
  teardown: () => service.stop(),
  execute: async (filename) => {
    let hasWarnings = false;
    try {
      const result = await service.build({
        entryPoints: [`./src/${filename}`],
        outfile: "./dist/main.js",
        platform: "node",
        minify: false,
        bundle: true,
      });
      hasWarnings = result.warnings.length > 0;
    } catch (err) {
      return "compilation error";
    }
    return execNode("dist/main.js") + (hasWarnings ? " + warnings" : "");
  },
});
