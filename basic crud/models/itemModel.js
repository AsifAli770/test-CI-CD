// In-memory data store (replace with a database later)
let items = [];
let nextId = 1;

const findAll = () => items;

const findById = (id) => items.find((item) => item.id === id);

const create = ({ name, description }) => {
  const item = { id: nextId++, name, description };
  items.push(item);
  return item;
};

const update = (id, data) => {
  const item = findById(id);
  if (!item) return null;
  if (data.name !== undefined) item.name = data.name;
  if (data.description !== undefined) item.description = data.description;
  return item;
};

const remove = (id) => {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
};

module.exports = { findAll, findById, create, update, remove };
