const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/transactions",transactionRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("FinTrack Server is Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});