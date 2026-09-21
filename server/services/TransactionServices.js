const Transaction = require("../models/Transaction");
const Goal = require("../models/Goal");

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

// ================================
// CREATE TRANSACTION
// ================================

const createTransaction = async ({ userId, category, type, amount, date }) => {
  const transactionAmount = Number(amount);

  if (!category || !type || !date || !transactionAmount) {
    throw new Error("All transaction fields are required");
  }

  if (!["Income", "Expense"].includes(type)) {
    throw new Error("Invalid transaction type");
  }

  if (transactionAmount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (type === "Expense") {
    const availableBalance = await getAvailableBalance(userId);

    if (transactionAmount > availableBalance) {
      throw new Error(
        `Insufficient available balance. Available: ₹${Math.max(
          0,
          availableBalance,
        ).toLocaleString("en-IN")}`,
      );
    }
  }

  const transaction = await Transaction.create({
    user: userId,
    category: category.trim(),
    type,
    amount: transactionAmount,
    date,
  });

  return transaction;
};

// ================================
// UPDATE TRANSACTION
// ================================

const updateTransaction = async ({ userId, target, changes }) => {
  if (!target || !changes) {
    throw new Error("Update target and changes are required");
  }

  // --------------------------------
  // Build search query
  // --------------------------------

  const query = {
    user: userId,
  };

  // Category target
  if (target.category) {
    query.category = {
      $regex: `^${String(target.category)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    };
  }

  // Amount target
  if (target.amount !== undefined && target.amount !== null) {
    const targetAmount = Number(target.amount);

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      throw new Error("Invalid target amount");
    }

    query.amount = targetAmount;
  }

  // Type target
  if (target.type) {
    if (!["Income", "Expense"].includes(target.type)) {
      throw new Error("Invalid target transaction type");
    }

    query.type = target.type;
  }

  // At least one target field is required
  if (
    !target.category &&
    target.amount === undefined &&
    target.type === undefined
  ) {
    throw new Error("Please specify which transaction should be updated");
  }

  // --------------------------------
  // Find matching transactions
  // --------------------------------

  const matchingTransactions = await Transaction.find(query);

  if (matchingTransactions.length === 0) {
    throw new Error("No matching transaction found");
  }

  if (matchingTransactions.length > 1) {
    throw new Error(
      "Multiple matching transactions found. Please specify the transaction more clearly",
    );
  }

  const transaction = matchingTransactions[0];

  // --------------------------------
  // Validate changes
  // --------------------------------

  if (
    changes.amount === undefined &&
    changes.category === undefined &&
    changes.type === undefined
  ) {
    throw new Error("No changes were provided");
  }

  // New values start with existing values
  let newAmount = Number(transaction.amount);
  let newCategory = transaction.category;
  let newType = transaction.type;

  // Amount change
  if (changes.amount !== undefined) {
    newAmount = Number(changes.amount);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
  }

  // Category change
  if (changes.category !== undefined) {
    if (!String(changes.category).trim()) {
      throw new Error("Category cannot be empty");
    }

    newCategory = String(changes.category).trim();
  }

  // Type change
  if (changes.type !== undefined) {
    if (!["Income", "Expense"].includes(changes.type)) {
      throw new Error("Invalid transaction type");
    }

    newType = changes.type;
  }


  // If final transaction is an Expense,
  // make sure the user has enough available balance.
  if (newType === "Expense") {
    const availableBalance = await getAvailableBalance(userId, transaction._id);

    if (newAmount > availableBalance) {
      throw new Error(
        `Insufficient available balance. Available: ₹${Math.max(
          0,
          availableBalance,
        ).toLocaleString("en-IN")}`,
      );
    }
  }



  transaction.amount = newAmount;
  transaction.category = newCategory;
  transaction.type = newType;

  await transaction.save();

  return transaction;
};


module.exports = {
  getAvailableBalance,
  createTransaction,
  updateTransaction,
};
