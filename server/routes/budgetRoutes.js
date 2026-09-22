const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const BudgetCategory = require("../models/BudgetCategory");
const protect = require("../middleware/authMiddleware");

// Create or update budget
router.post("/", protect, async (req, res) => {
  try {
    const { amount, month, year } = req.body;

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

    const currentDate = new Date();

    const currentMonth = currentDate.toLocaleString("en-US", {
      month: "long",
    });

    const currentYear = currentDate.getFullYear();

    const nextDate = new Date(currentYear, currentDate.getMonth() + 1, 1);

    const nextMonth = nextDate.toLocaleString("en-US", {
      month: "long",
    });

    const nextYear = nextDate.getFullYear();

    const isCurrentMonth =
      month === currentMonth && Number(year) === currentYear;

    const isNextMonth = month === nextMonth && Number(year) === nextYear;

    if (!isCurrentMonth && !isNextMonth) {
      return res.status(400).json({
        message: "You can only set a budget for the current or next month",
      });
    }

    const existingBudget = await Budget.findOne({
      user: req.user._id,
      month,
      year: Number(year),
    });

    if (existingBudget) {
      existingBudget.amount = Number(amount);

      await existingBudget.save();

      return res.status(200).json({
        message: "Budget updated successfully",
        budget: existingBudget,
      });
    }

    const newBudget = new Budget({
      user: req.user._id,
      amount: Number(amount),
      month,
      year: Number(year),
    });

    await newBudget.save();

    return res.status(201).json({
      message: "Budget added successfully",
      budget: newBudget,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error saving budget",
      error: error.message,
    });
  }
});

// Get budget
router.get("/", protect, async (req, res) => {
  try {
    const { month, year } = req.query;

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year: Number(year),
    });

    return res.status(200).json(budget);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching budget",
      error: error.message,
    });
  }
});

// Delete budget
router.delete("/", protect, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required",
      });
    }

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year: Number(year),
    });

    if (!budget) {
      return res.status(404).json({
        message: `Budget not found for ${month} ${year}`,
      });
    }

    await BudgetCategory.deleteMany({
      user: req.user._id,
      month,
      year: Number(year),
    });

    await Budget.deleteOne({
      _id: budget._id,
      user: req.user._id,
    });

    return res.status(200).json({
      message: `Budget deleted successfully for ${month} ${year}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting budget",
      error: error.message,
    });
  }
});

module.exports = router;
