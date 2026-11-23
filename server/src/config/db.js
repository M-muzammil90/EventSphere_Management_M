import mongoose from "mongoose";

const connectDB = async () => {
  const uri =
    process.env.NODE_ENV === "test"
      ? process.env.MONGO_URI_TEST
      : process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventsphere";

  if (!uri) throw new Error("MONGO_URI is not defined in the environment");

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => console.log("✔ MongoDB connected:", mongoose.connection.name));
  mongoose.connection.on("error", (err) => console.error("✖ MongoDB connection error:", err.message));
  mongoose.connection.on("disconnected", () => console.warn("⚠ MongoDB disconnected"));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    family: 4, // force IPv4 — avoids Windows "localhost → ::1" resolution issues
  });

  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};

export default connectDB;
