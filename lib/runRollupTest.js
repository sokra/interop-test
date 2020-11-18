const childProcess = require("child_process");
const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

childProcess.execSync(`yarn add rollup@2 @rollup/plugin-commonjs@16`, {
  stdio: "inherit",
});

const rollup = require("rollup");
const commonjs = require("@rollup/plugin-commonjs");
runTest("rollup", async (filename) => {
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
  return execNode("dist/index.js") + (hasWarnings ? " + warnings" : "");
}).catch((err) => console.error(err));
