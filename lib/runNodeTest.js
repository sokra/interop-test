const execNode = require("./helpers/execNode");
const runTest = require("./helpers/runTest");

runTest(
  "node",
  async (filename) => {
    return execNode(`src/${filename}`);
  },
  true
).catch((err) => console.error(err));
