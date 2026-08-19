const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const protect = require("../middleware/authMiddleware");

// Create or update budget
router.post("/", protect, async (req, res) => {
  try {
    const { amount, month, year } = req.body;

    // Basic validation
    if (!amount || !month || !year) {
      return res.status(400).json({
        message: "Amount, month and year are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Budget amount must be greater than 0",
      });
    }

    // Current date
    const currentDate = new Date();

    const currentMonth = currentDate.toLocaleString("en-US", {
      month: "long",
    });

    const currentYear = currentDate.getFullYear();

    // Next month
    const nextDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1,
    );

    const nextMonth = nextDate.toLocaleString("en-US", {
      month: "long",
    });

    const nextYear = nextDate.getFullYear();

    // Check if selected month is current month
    const isCurrentMonth =
      month === currentMonth && Number(year) === currentYear;

    // Check if selected month is next month
    const isNextMonth = month === nextMonth && Number(year) === nextYear;

    // Only current or next month allowed
    if (!isCurrentMonth && !isNextMonth) {
      return res.status(400).json({
        message: "You can only set a budget for the current or next month",
      });
    }

    // Find budget for THIS USER only
    const existingBudget = await Budget.findOne({
      user: req.user._id,
      month,
      year: Number(year),
    });

    // If budget exists → update
    if (existingBudget) {
      existingBudget.amount = Number(amount);

      await existingBudget.save();

      return res.status(200).json({
        message: "Budget updated successfully",
        budget: existingBudget,
      });
    }

    // Create new budget for logged-in user
    const newBudget = new Budget({
      user: req.user._id,
      amount: Number(amount),
      month,
      year: Number(year),
    });

    await newBudget.save();

    res.status(201).json({
      message: "Budget added successfully",
      budget: newBudget,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving budget",
      error: error.message,
    });
  }
});

// Get budget for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const { month, year } = req.query;

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year: Number(year),
    });

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching budget",
      error: error.message,
    });
  }
});

module.exports = router;
