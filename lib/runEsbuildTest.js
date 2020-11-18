const childProcess = require("child_process");
const runTest = require("./helpers/runTest");
const execNode = require("./helpers/execNode");

childProcess.execSync(`yarn add esbuild`, {
  stdio: "inherit",
});

const { startService } = require("esbuild");
(async () => {
  const service = await startService();
  try {
    await runTest("esbuild", async (filename) => {
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
    });
  } finally {
    service.stop();
  }
})().catch((err) => console.error(err));
