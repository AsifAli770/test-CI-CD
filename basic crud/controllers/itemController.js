const mongoose = require("mongoose");
const Item = require("../models/itemModel");

const notFound = (res) => res.status(404).json({ message: "Item not found" });

const getItems = async (req, res) => {
  const items = await Item.find().sort({ createdAt: 1 });
  res.json(items);
};

const getItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const item = await Item.findById(req.params.id);
  if (!item) return notFound(res);
  res.json(item);
};

const createItem = async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ message: "Name is required" });
  const item = await Item.create({ name, description });
  res.status(201).json(item);
};

const updateItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const { name, description } = req.body || {};
  const item = await Item.findByIdAndUpdate(
    req.params.id,
    { name, description },
    { new: true, runValidators: true }
  );
  if (!item) return notFound(res);
  res.json(item);
};

const deleteItem = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) return notFound(res);
  res.json({ message: "Item deleted" });
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem };
