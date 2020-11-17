const childProcess = require("child_process");
const runTest = require("./helpers/runTest");
childProcess.execSync(`yarn add esbuild`, {
  stdio: "inherit",
});

const { build, startService } = require("esbuild");
(async () => {
  const service = await startService();
  try {
    await runTest(async (filename) => {
      let bundle;
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
      try {
        return (
          "`" +
          childProcess
            .execSync(`node dist/main.js`, {
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
    });
  } finally {
    service.stop();
  }
})().catch((err) => console.error(err));
