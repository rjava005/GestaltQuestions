function generate() {
  const a = 2;
  const b = 3;
  const total = a + b;

  console.log("mock js no import");

  return {
    source: "mock_entry.js",
    values: { a: a, b: b },
    total: total,
  };
}

module.exports = { generate };
