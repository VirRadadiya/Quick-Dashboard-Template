// @file backend/express-app.js
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import auth from "./api/auth.js";
import user from "./api/user.js";


import HandleErrors from "./utils/error-handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expressApp = async (app) => {
  // Basic middleware
  app.use(express.json({ limit: "10gb" }));
  app.use(express.urlencoded({ extended: true, limit: "10gb" }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "public")));

  if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // CORS
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://divinesyncserve.com",
    "https://www.divinesyncserve.com",
    "https://dashboard.divinesyncserve.com",
    "https://www.dashboard.divinesyncserve.com",
    "https://api.divinesyncserve.com",
    "https://www.api.divinesyncserve.com",
    "https://backend.divinesyncserve.com",
    "https://www.backend.divinesyncserve.com",
    "https://aire.divinesyncserve.com",
    "https://www.aire.divinesyncserve.com",
    "https://hotel.divinesyncserve.com",
    "https://www.hotel.divinesyncserve.com",
    "https://backend.hotel.divinesyncserve.com",
    "https://www.backend.hotel.divinesyncserve.com",
    ...(process.env.CLIENT_URLS || "").split(",").filter((url) => url.trim()),
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
      optionsSuccessStatus: 204,
    })
  );

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(hpp());

  // Sanitization
  app.use((req, res, next) => {
    if (req.query) {
      req.sanitizedQuery = Object.fromEntries(
        Object.entries(req.query).map(([k, v]) => [
          k,
          typeof v === "string" ? v.replace(/[<>]/g, "") : v,
        ])
      );
    } else {
      req.sanitizedQuery = {};
    }
    if (req.body) {
      req.sanitizedBody = Object.fromEntries(
        Object.entries(req.body).map(([k, v]) => [
          k,
          typeof v === "string" ? v.replace(/[<>]/g, "") : v,
        ])
      );
    } else {
      req.sanitizedBody = {};
    }
    next();
  });

  // Routes
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Backend API",
      version: "1.0",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  auth(app);
  user(app);


  // Error handling (must be last)
  app.use(HandleErrors);
};

export default expressApp;
