const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

let service;
runTest({
  name: "esbuild",
  packages: ["esbuild@0.8.57"],
  setup: async () => (service = await require("esbuild").startService()),
  teardown: () => service.stop(),
  execute: async (filename, idx) => {
    let hasWarnings = false;
    try {
      const result = await service.build({
        entryPoints: [`./src/${filename}`],
        outfile: `./dist/main${idx}.js`,
        platform: "node",
        minify: false,
        bundle: true,
      });
      hasWarnings = result.warnings.length > 0;
    } catch (err) {
      return "compilation error";
    }
    return (
      (await execNode(`dist/main${idx}.js`)) +
      (hasWarnings ? " + warnings" : "")
    );
  },
});
