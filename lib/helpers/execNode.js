const childProcess = require("child_process");

module.exports = (path) => {
  try {
    const output = childProcess
      .execSync(`node ${path}`, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      })
      .trim();
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
