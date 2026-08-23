const express = require("express");
const router = express.Router();

const Goal = require("../models/Goal");
const protect = require("../middleware/authMiddleware");


// =========================
// GET ALL USER GOALS
// =========================

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


// =========================
// CREATE GOAL
// =========================

router.post("/", protect, async (req, res) => {
  try {
    const { name, targetAmount } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({
        message: "Goal name and target amount are required",
      });
    }

    if (Number(targetAmount) <= 0) {
      return res.status(400).json({
        message: "Target amount must be greater than 0",
      });
    }

    const goal = new Goal({
      userId: req.user._id,
      name,
      targetAmount: Number(targetAmount),
      savedAmount: 0,
    });

    await goal.save();

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create goal",
      error: error.message,
    });
  }
});


// =========================
// UPDATE GOAL
// =========================

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

    if (name) {
      goal.name = name;
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
          message:
            "Target amount cannot be less than saved amount",
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


// =========================
// ADD MONEY TO GOAL
// =========================

router.put("/:id/add-money", protect, async (req, res) => {
  try {
    const { amount } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    const money = Number(amount);

    if (!money || money <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
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


// =========================
// DELETE GOAL
// =========================

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
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete goal",
      error: error.message,
    });
  }
});


module.exports = router;