import mongoose from 'mongoose';

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/mern_app';

export async function connectDB(uri: string = process.env.MONGO_URI || DEFAULT_MONGO_URI): Promise<void> {
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
