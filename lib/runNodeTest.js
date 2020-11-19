const execNode = require("./helpers/execNode");
const runTest = require("./helpers/runTest");

runTest({
  name: process.version.startsWith("v14.") ? "node-lts" : "node",
  execute: async (filename) => {
    return execNode(`src/${filename}`);
  },
  onlyMjs: true,
});
