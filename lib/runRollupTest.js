const childProcess = require("child_process");
const runTest = require("./helpers/runTest");
childProcess.execSync(`yarn add rollup@2 @rollup/plugin-commonjs@16`, {
  stdio: "inherit",
});

const rollup = require("rollup");
const commonjs = require("@rollup/plugin-commonjs");
runTest(async (filename) => {
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
}).catch((err) => console.error(err));
