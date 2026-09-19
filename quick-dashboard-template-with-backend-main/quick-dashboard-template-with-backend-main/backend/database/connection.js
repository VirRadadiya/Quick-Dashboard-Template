// @file backend/database/connection.js
import mongoose from "mongoose";

const databaseConnection = async () => {
    try {
        const DB_URL = process.env.MONGODB_URI;
        if (!DB_URL) {
            console.warn("⚠️ MONGODB_URI not set — skipping database connection");
            return;
        }
        await mongoose.connect(DB_URL);
        console.log("✅ Database connected");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        // Don't crash — allow server to start for PPT endpoints
    }
};

export default databaseConnection;
