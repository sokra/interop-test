const childProcess = require("child_process");

module.exports = (path) => {
  try {
    return (
      "`" +
      childProcess
        .execSync(`node ${path}`, {
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "pipe"],
        })
        .trim() +
      "`"
    );
  } catch (err) {
    if (err && err.stderr && err.stderr.includes("SyntaxError"))
      return "syntax error";
    console.log(err);
    return "runtime error";
  }
};
