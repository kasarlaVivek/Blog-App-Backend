import exp from "express";
import { connect } from "mongoose";
import { config } from "dotenv";
import { adminApp } from "./API/adminApi.js";
import { authorApp } from "./API/authorApi.js";
import { userApp } from "./API/userApi.js";
import cookieParser from "cookie-parser";
import { commonApp } from "./API/commonApi.js";
import cors from "cors";
config(); // process.env


// create express application
const app = exp();

// trust proxy — required for platforms like Render, Railway, Heroku
app.set("trust proxy", 1);

// build allowed origins list from FRONTEND_URL env variable + localhost fallbacks
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://blog-app-frontend-beta-eight.vercel.app"
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(",").forEach((url) => {
    const trimmedUrl = url.trim().replace(/\/$/, ""); // Remove trailing slash
    if (trimmedUrl && !allowedOrigins.includes(trimmedUrl)) {
      allowedOrigins.push(trimmedUrl);
    }
  });
}

// Normalize all default origins too
const normalizedAllowedOrigins = allowedOrigins.map(url => url.replace(/\/$/, ""));

// use cors for frontend and backend interaction
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        // Instead of returning an error which might skip header setting, 
        // we return null, false which tells CORS middleware to not allow it
        return callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200
  })
);

// add body parser middleware
app.use(exp.json());
// add cookie-parser middleware
app.use(cookieParser());


// health check endpoint (used by deployment platforms to verify the server is alive)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// root endpoint
app.get("/", (req, res) => {
  res.send({ message: "Welcome to the Blog App API" });
});


// connect API's
app.use("/user-api", userApp);
app.use("/admin-api", adminApp);
app.use("/author-api", authorApp);
app.use("/common-api", commonApp);

// middleware to deal with invalid path
app.use((req, res, next) => {
  res.status(404).json({ message: `${req.url} is invalid path` });
});

// error handling middleware
app.use((err, req, res, next) => {
  console.error("Error name:", err.name);
  console.error("Error code:", err.code ?? err.cause?.code);
  console.error("Full error:", err);

  // mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // MongoDB duplicate key error (Mongoose v9 wraps it in err.cause)
  const errCode = err.code ?? err.cause?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue;

  if (errCode === 11000 && keyValue) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];
    return res.status(409).json({
      message: "Conflict detected",
      error: `${field} "${value}" already exists`,
    });
  }

  // Mongoose v9 MongooseError wrapping duplicate key (fallback)
  if (err.name === "MongooseError" && err.message) {
    return res.status(409).json({
      message: "Conflict detected",
      error: err.message,
    });
  }

  // ✅ HANDLE CUSTOM ERRORS
  if (err.status) {
    return res.status(err.status).json({
      message: "error occurred",
      error: err.message,
    });
  }

  // default server error
  res.status(500).json({
    message: "error occurred",
    error: err.message || "Server side error",
  });
});


// connect to database and start server
const PORT = process.env.PORT || 3000;

const connection = async () => {
  try {
    await connect(process.env.DB_URL);
    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, () =>
      console.log(`🚀 Server listening on port ${PORT}`)
    );

    // graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
};
connection();