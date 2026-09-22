import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai_finance_tracker";

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}). Attempting local MongoDB fallback...`);
    try {
      const localConn = await mongoose.connect("mongodb://127.0.0.1:27017/ai_finance_tracker", {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`Fallback Local MongoDB Connected: ${localConn.connection.host}`);
    } catch (localErr) {
      console.error(`MongoDB Connection Error: ${localErr.message}`);
    }
  }
};

export default connectDB;