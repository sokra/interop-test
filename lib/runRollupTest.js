const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

let rollup;
let commonjs;
runTest({
  name: "rollup",
  packages: ["rollup", "@rollup/plugin-commonjs"],
  setup: () => {
    rollup = require("rollup");
    commonjs = require("@rollup/plugin-commonjs");
  },
  execute: async (filename, idx) => {
    let bundle;
    let hasWarnings = false;
    try {
      bundle = await rollup.rollup({
        input: `src/${filename}`,
        plugins: [commonjs()],
        external: ["util"],
        onwarn: (warning, warn) => {
          hasWarnings = true;
        },
      });
      await bundle.write({
        dir: "dist",
        format: "cjs",
      });
    } catch (err) {
      return "compilation error";
    }
    return (
      (await execNode(`dist/index${idx}.js`)) +
      (hasWarnings ? " + warnings" : "")
    );
  },
});
