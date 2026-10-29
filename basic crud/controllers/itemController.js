const Item = require("../models/itemModel");

const getItems = (req, res) => {
  res.json(Item.findAll());
};

const getItem = (req, res) => {
  const item = Item.findById(Number(req.params.id));
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json(item);
};

const createItem = (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ message: "Name is required" });
  const item = Item.create({ name, description });
  res.status(201).json(item);
};

const updateItem = (req, res) => {
  const item = Item.update(Number(req.params.id), req.body || {});
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json(item);
};

const deleteItem = (req, res) => {
  const deleted = Item.remove(Number(req.params.id));
  if (!deleted) return res.status(404).json({ message: "Item not found" });
  res.json({ message: "Item deleted" });
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem };
