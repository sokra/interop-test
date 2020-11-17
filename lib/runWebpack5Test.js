const childProcess = require("child_process");
const runWebpackTest = require("./helpers/runWebpackTest");
childProcess.execSync(`yarn add webpack@5 webpack-cli@4`, { stdio: "inherit" });

runWebpackTest("webpack5").catch((err) => console.error(err));
