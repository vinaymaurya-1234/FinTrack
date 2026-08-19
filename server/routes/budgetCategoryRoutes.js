const express = require("express");
const router = express.Router();

const BudgetCategory = require("../models/BudgetCategory");
const Budget = require("../models/Budget");
const protect = require("../middleware/authMiddleware");


// ADD BUDGET CATEGORY
router.post("/", protect, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    // Basic validation
    if (!category || !amount || !month || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    // Find user's monthly budget
    const monthlyBudget = await Budget.findOne({
      user: req.user._id,
      month,
      year: Number(year),
    });

    // User must create monthly budget first
    if (!monthlyBudget) {
      return res.status(400).json({
        message: "Please set your monthly budget first",
      });
    }

    // Check if category already exists
    const existingCategory = await BudgetCategory.findOne({
      user: req.user._id,
      category,
      month,
      year: Number(year),
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "This category already exists in your budget plan",
      });
    }

    // Get all existing categories
    const existingCategories = await BudgetCategory.find({
      user: req.user._id,
      month,
      year: Number(year),
    });

    // Calculate already allocated amount
    const totalAllocated = existingCategories.reduce(
      (total, item) => total + item.amount,
      0,
    );

    // Calculate new total
    const newTotalAllocated =
      totalAllocated + Number(amount);

    // Prevent allocation above monthly budget
    if (newTotalAllocated > monthlyBudget.amount) {
      return res.status(400).json({
        message: `You only have ₹${
          monthlyBudget.amount - totalAllocated
        } left to allocate`,
      });
    }

    // Create category
    const newCategory = await BudgetCategory.create({
      user: req.user._id,
      category,
      amount: Number(amount),
      month,
      year: Number(year),
    });

    res.status(201).json({
      message: "Budget category added successfully",
      category: newCategory,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error adding budget category",
      error: error.message,
    });
  }
});


// GET ALL CATEGORIES FOR CURRENT MONTH
router.get("/", protect, async (req, res) => {
  try {
    const { month, year } = req.query;

    const categories = await BudgetCategory.find({
      user: req.user._id,
      month,
      year: Number(year),
    }).sort({ createdAt: 1 });

    res.status(200).json(categories);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching budget categories",
      error: error.message,
    });
  }
});


module.exports = router;