import mongoose from "mongoose";

// Try multiple connection strings to handle DNS issues
const MONGODB_URI_SRV =
  process.env.MONGODB_URI ||
  "mongodb+srv://udevtime:Usman11801@cluster0.6vrtls1.mongodb.net/tahaecom?retryWrites=true&w=majority";
const MONGODB_URI_DIRECT =
  "mongodb://udevtime:Usman11801@cluster0-shard-00-00.6vrtls1.mongodb.net:27017,cluster0-shard-00-01.6vrtls1.mongodb.net:27017,cluster0-shard-00-02.6vrtls1.mongodb.net:27017/tahaecom?ssl=true&replicaSet=atlas-14b8sh-shard-0&authSource=admin&retryWrites=true&w=majority";

if (!MONGODB_URI_SRV) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

declare global {
  var mongoose: { conn: unknown; promise: unknown } | undefined;
}

const cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryWrites: true,
    };

    // Try SRV connection first, then fallback to direct connection
    const tryConnection = async (uri: string, isFallback = false) => {
      try {
        console.log(
          `Attempting MongoDB connection${isFallback ? " (fallback)" : ""}...`
        );
        const result = await mongoose.connect(uri, opts);
        console.log("MongoDB connected successfully");
        return result;
      } catch (error) {
        console.error(
          `MongoDB connection failed${
            isFallback ? " (fallback also failed)" : ""
          }:`,
          error
        );
        if (!isFallback) {
          console.log("Trying fallback connection...");
          return tryConnection(MONGODB_URI_DIRECT, true);
        }
        throw error;
      }
    };

    cached.promise = tryConnection(MONGODB_URI_SRV);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("Failed to connect to MongoDB:", e);
    throw e;
  }

  return cached.conn;
}

// Add connection event listeners
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

export default dbConnect;
