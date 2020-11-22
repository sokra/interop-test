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
    if (!output) throw new Error(execResult.stderr);
    return "`" + output + "`";
  } catch (err) {
    if (err && err.message) {
      if (err.message.includes("SyntaxError")) return "syntax error";
      if (err.message.includes("TypeError")) return "type error";
      console.log(err.message);
      return "runtime error";
    }
    console.log(err);
    return "runtime error";
  }
};
