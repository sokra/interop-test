const childProcess = require("child_process");
const runTest = require("./helpers/runTest");

runTest(
  "node",
  async (filename) => {
    try {
      return (
        "`" +
        childProcess
          .execSync(`node src/${filename}`, {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "pipe"],
          })
          .trim() +
        "`"
      );
    } catch (err) {
      return "runtime error";
    }
  },
  true
).catch((err) => console.error(err));
