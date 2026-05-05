const items = new Map();
let nextId = 1;

function list() {
  return [...items.values()];
}

function create({ title }) {
  const todo = { id: nextId++, title, done: false };
  items.set(todo.id, todo);
  return todo;
}

function get(id) {
  return items.get(id);
}

function clear() {
  items.clear();
  nextId = 1;
}

module.exports = { list, create, get, clear };
