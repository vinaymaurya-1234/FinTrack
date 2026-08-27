const express = require("express");
const Transaction = require("../models/Transaction");
const Goal = require("../models/Goal");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const getAvailableBalance = async (userId, excludeId = null) => {
  const query = { user: userId };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const transactions = await Transaction.find(query);
  const goals = await Goal.find({ userId });

  const income = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expenses;

  const locked = goals.reduce((sum, goal) => sum + Number(goal.savedAmount), 0);

  return balance - locked;
};

// ADD TRANSACTION
router.post("/", protect, async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;
    const transactionAmount = Number(amount);

    if (!category || !type || !date || !transactionAmount) {
      return res.status(400).json({
        message: "All transaction fields are required",
      });
    }

    if (!["Income", "Expense"].includes(type)) {
      return res.status(400).json({
        message: "Invalid transaction type",
      });
    }

    if (transactionAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    if (type === "Expense") {
      const availableBalance = await getAvailableBalance(req.user._id);

      if (transactionAmount > availableBalance) {
        return res.status(400).json({
          message: `Insufficient available balance. Available: ₹${Math.max(
            0,
            availableBalance,
          ).toLocaleString("en-IN")}`,
        });
      }
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      category,
      type,
      amount: transactionAmount,
      date,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({
      message: "Error creating transaction",
      error: error.message,
    });
  }
});

// GET USER TRANSACTIONS
router.get("/", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({ date: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching transactions",
      error: error.message,
    });
  }
});

// DELETE TRANSACTION
router.delete("/:id", protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting transaction",
      error: error.message,
    });
  }
});

// UPDATE TRANSACTION
router.put("/:id", protect, async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;
    const transactionAmount = Number(amount);

    if (!category || !type || !date || !transactionAmount) {
      return res.status(400).json({
        message: "All transaction fields are required",
      });
    }

    if (!["Income", "Expense"].includes(type)) {
      return res.status(400).json({
        message: "Invalid transaction type",
      });
    }

    if (transactionAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    if (type === "Expense") {
      const availableBalance = await getAvailableBalance(
        req.user._id,
        transaction._id,
      );

      if (transactionAmount > availableBalance) {
        return res.status(400).json({
          message: `Insufficient available balance. Available: ₹${Math.max(
            0,
            availableBalance,
          ).toLocaleString("en-IN")}`,
        });
      }
    }

    transaction.category = category;
    transaction.type = type;
    transaction.amount = transactionAmount;
    transaction.date = date;

    await transaction.save();

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({
      message: "Error updating transaction",
      error: error.message,
    });
  }
});

module.exports = router;
