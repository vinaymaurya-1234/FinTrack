const express = require("express");
const Transaction = require("../models/Transaction");
const protect = require("../middleware/authMiddleware");

const {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../services/TransactionServices");

const router = express.Router();

// ==========================================
// ADD TRANSACTION
// ==========================================

router.post("/", protect, async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;

    const transaction = await createTransaction({
      userId: req.user._id,
      category,
      type,
      amount,
      date,
    });

    return res.status(201).json(transaction);
  } catch (error) {
    if (
      error.message === "All transaction fields are required" ||
      error.message === "Invalid transaction type" ||
      error.message === "Amount must be greater than 0" ||
      error.message.startsWith("Insufficient available balance")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Error creating transaction",
      error: error.message,
    });
  }
});

// ==========================================
// GET USER TRANSACTIONS
// ==========================================

router.get("/", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
    }).sort({
      date: -1,
    });

    return res.status(200).json(transactions);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching transactions",
      error: error.message,
    });
  }
});

// ==========================================
// DELETE TRANSACTION
// ==========================================

router.delete("/:id", protect, async (req, res) => {
  try {
    const transaction = await deleteTransaction({
      userId: req.user._id,
      transactionId: req.params.id,
    });

    return res.status(200).json({
      message: "Transaction deleted successfully.",
      transaction,
    });
  } catch (error) {
    if (error.message === "Transaction ID is required") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message === "Transaction not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Error deleting transaction",
      error: error.message,
    });
  }
});

// ==========================================
// UPDATE TRANSACTION
// ==========================================

router.put("/:id", protect, async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;

    const transaction = await updateTransaction({
      userId: req.user._id,

      target: {
        id: req.params.id,
      },

      changes: {
        category,
        type,
        amount,
        date,
      },
    });

    return res.status(200).json(transaction);
  } catch (error) {
    if (
      error.message === "All transaction fields are required" ||
      error.message === "Invalid transaction type" ||
      error.message === "Amount must be greater than 0" ||
      error.message.startsWith("Insufficient available balance")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message === "Transaction not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Error updating transaction",
      error: error.message,
    });
  }
});

module.exports = router;
