const express = require("express");
const router = express.Router();

const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");
const protect = require("../middleware/authMiddleware");

// Get user's total available balance
const getAvailableBalance = async (userId) => {
  const transactions = await Transaction.find({ user: userId });
  const goals = await Goal.find({ userId });

  const totalIncome = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBalance = totalIncome - totalExpense;

  const reservedAmount = goals.reduce(
    (sum, goal) => sum + Number(goal.savedAmount),
    0,
  );

  return totalBalance - reservedAmount;
};

// GET ALL USER GOALS
router.get("/", protect, async (req, res) => {
  try {
    const goals = await Goal.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch goals",
      error: error.message,
    });
  }
});

// CREATE GOAL
router.post("/", protect, async (req, res) => {
  try {
    const { name, targetAmount } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({
        message: "Goal name and target amount are required",
      });
    }

    const amount = Number(targetAmount);

    if (amount <= 0) {
      return res.status(400).json({
        message: "Target amount must be greater than 0",
      });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      name,
      targetAmount: amount,
      savedAmount: 0,
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create goal",
      error: error.message,
    });
  }
});

// UPDATE GOAL
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, targetAmount } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    if (name !== undefined) {
      goal.name = name.trim();
    }

    if (targetAmount !== undefined) {
      const amount = Number(targetAmount);

      if (amount <= 0) {
        return res.status(400).json({
          message: "Target amount must be greater than 0",
        });
      }

      if (amount < goal.savedAmount) {
        return res.status(400).json({
          message: "Target amount cannot be less than saved amount",
        });
      }

      goal.targetAmount = amount;
    }

    await goal.save();

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update goal",
      error: error.message,
    });
  }
});

// ADD MONEY TO GOAL
router.put("/:id/add-money", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const money = Number(amount);

    if (!money || money <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    const remaining = goal.targetAmount - goal.savedAmount;

    if (money > remaining) {
      return res.status(400).json({
        message: `Only ₹${remaining.toLocaleString(
          "en-IN",
        )} is remaining for this goal`,
      });
    }

    const availableBalance = await getAvailableBalance(req.user._id);

    if (money > availableBalance) {
      return res.status(400).json({
        message: `Insufficient available balance. You can reserve up to ₹${Math.max(
          0,
          availableBalance,
        ).toLocaleString("en-IN")}`,
      });
    }

    goal.savedAmount += money;

    await goal.save();

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add money",
      error: error.message,
    });
  }
});

// RELEASE MONEY FROM GOAL
router.put("/:id/release-money", protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const money = Number(amount);

    if (!money || money <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    if (money > goal.savedAmount) {
      return res.status(400).json({
        message: `Only ₹${goal.savedAmount.toLocaleString(
          "en-IN",
        )} is reserved in this goal`,
      });
    }

    goal.savedAmount -= money;

    await goal.save();

    res.status(200).json(goal);
  } catch (error) {
    res.status(500).json({
      message: "Failed to release money",
      error: error.message,
    });
  }
});

// DELETE GOAL
router.delete("/:id", protect, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    res.status(200).json({
      message: "Goal deleted successfully",
      releasedAmount: goal.savedAmount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete goal",
      error: error.message,
    });
  }
});

module.exports = router;
