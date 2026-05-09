import exp from "express";
import { connect } from "mongoose";
import { config } from "dotenv";
import { adminApp } from "./API/adminApi.js";
import { authorApp } from "./API/authorApi.js";
import { userApp } from "./API/userApi.js";
import cookieParser from "cookie-parser";
import { commonApp } from "./API/commonApi.js";
import cors from "cors"
config() //process.env


// create express application
const app = exp();
// use cors for frontend and backend interaction
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));
// add body parser middleware
app.use(exp.json());
// add cookie-parser middleware
app.use(cookieParser());


// conect to database
const connection = async () => {
  try {
    await connect(process.env.DB_URL);
    console.log("database connected successfully");
    app.listen(process.env.PORT, () => console.log(`server listening on port ${process.env.PORT}..`));
  } catch (err) {
    console.log("err occured", err);
  }
}
connection();


// connect API's
app.use("/user-api", userApp);
app.use("/admin-api", adminApp);
app.use("/author-api", authorApp);
app.use("/common-api", commonApp)

// middleware to deal with invalid path
app.use((req, res, next) => {
  console.log(req);

  res.json({ message: `${req.url} is invalid path` });
})

// error handling middleware
app.use((err, req, res, next) => {

  console.log("Error name:", err.name);
  console.log("Error code:", err.code);
  console.log("Full error:", err);

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

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  // Usually 'err' is passed from the catch block
if (err.code === 11000) {
  // MongoDB stores the conflicting data in err.keyValue
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  return res.status(409).json({
    message: "Conflict detected",
    // Use backticks (`) for template literals
    error: `${field} "${value}" already exists`,
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
    error: "Server side error",
  });
});