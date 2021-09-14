const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

let esbuild;
runTest({
  name: "esbuild",
  packages: ["esbuild"],
  setup: async () => {
    esbuild = require("esbuild");
    await esbuild.initialize();
  },
  execute: async (filename, idx) => {
    let hasWarnings = false;
    try {
      const result = await esbuild.build({
        entryPoints: [`./src/${filename}`],
        outfile: `./dist/main${idx}.js`,
        platform: "node",
        minify: false,
        bundle: true,
        logLevel: "silent",
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
