const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const authRoutes = require("./routes/authRoutes");
const budgetCategoryRoutes = require("./routes/budgetCategoryRoutes")

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/transactions",transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/auth", authRoutes)
app.use("/api/budget-categories", budgetCategoryRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("FinTrack Server is Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});