const execNode = require("./helpers/execNode");
const runTest = require("./helpers/runTest");

runTest({
  name: "node",
  execute: async (filename) => {
    return execNode(`src/${filename}`);
  },
  onlyMjs: true,
});
