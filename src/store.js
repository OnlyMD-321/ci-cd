const items = new Map();

function list() {
  return [...items.values()];
}

module.exports = { list };
