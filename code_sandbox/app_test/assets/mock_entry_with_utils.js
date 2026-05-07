const { addNumbers, buildMessage } = require("./utils");

function generate() {
  const a = 4;
  const b = 5;
  const total = addNumbers(a, b);

  console.log("mock js with utils");

  return {
    source: "mock_entry_with_utils.js",
    values: { a: a, b: b },
    total: total,
    message: buildMessage(a, b, total),
  };
}

module.exports = { generate };
