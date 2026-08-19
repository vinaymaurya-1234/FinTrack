const express = require("express");
const Transaction = require("../models/Transaction");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Add Transaction
router.post("/", protect, async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;

    const newTransaction = await Transaction.create({
      user: req.user._id,
      category,
      type,
      amount,
      date,
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({
      message: "Error creating transaction",
      error: error.message,
    });
  }
});

// Get All Transactions of logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({
      date: -1,
    });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching transactions",
      error: error.message,
    });
  }
});

// Delete Transaction
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

// Update Transaction
router.put("/:id", protect, async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;

    const updatedTransaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        category,
        type,
        amount,
        date,
      },
      {
        new: true,
      },
    );

    if (!updatedTransaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({
      message: "Error updating transaction",
      error: error.message,
    });
  }
});

module.exports = router;
