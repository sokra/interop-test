const childProcess = require("child_process");
const { promisify } = require("util");

const exec = promisify(childProcess.exec);

module.exports = async (path) => {
  let execResult;
  try {
    execResult = await exec(`node ${path}`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const output = execResult.stdout.trim();
    return "`" + output + "`";
  } catch (err) {
    if (err && err.stderr) {
      if (err.stderr.includes("SyntaxError")) return "syntax error";
      if (err.stderr.includes("TypeError")) return "type error";
      console.log(err.stderr);
      return "runtime error";
    }
    console.log(err);
    return "runtime error";
  }
};
