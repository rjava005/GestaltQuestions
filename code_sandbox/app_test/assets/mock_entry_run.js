function run() {
  const x = 6;
  const y = 7;
  const total = x + y;

  console.log("mock js custom func");

  return {
    source: "mock_entry_run.js",
    values: { x: x, y: y },
    total: total,
  };
}

module.exports = { run };
