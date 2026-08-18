const express = require("express");
const Transaction = require("../models/Transaction");

const router = express.Router();

// Add Transaction
router.post("/", async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;

    const newTransaction = await Transaction.create({
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

// Get All Transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({
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
router.delete("/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting transaction",
    });
  }
});

// Update Transaction
router.put("/:id", async (req, res) => {
  try {
    const { category, type, amount, date } = req.body;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        category,
        type,
        amount,
        date,
      },
      { new: true },
    );

    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({
      message: "Error updating transaction",
    });
  }
});

module.exports = router;