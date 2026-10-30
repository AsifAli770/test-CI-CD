const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;
  if (!uri) throw new Error("MONGODB_URI is not set in .env");
  if (!dbName) throw new Error("DB_NAME is not set in .env");

  await mongoose.connect(uri, { dbName });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${dbName}`);
};

module.exports = connectDB;
