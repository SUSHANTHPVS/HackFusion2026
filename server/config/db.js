import mongoose from "mongoose";

export async function connectDB(uri) {
  await mongoose.connect(uri, {
    autoIndex: false,
    maxPoolSize: 30,
    minPoolSize: 5
  });
}
