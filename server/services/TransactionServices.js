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

  const locked = goals.reduce((sum, goal) => sum + Number(goal.savedAmount), 0);

  return income - expenses - locked;
};

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

  return await Transaction.create({
    user: userId,
    category: category.trim(),
    type,
    amount: transactionAmount,
    date,
  });
};

const buildTargetQuery = (userId, target) => {
  if (!target) {
    throw new Error("Transaction target is required");
  }

  const query = { user: userId };

  if (target.category) {
    const category = String(target.category)
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    query.category = {
      $regex: `^${category}$`,
      $options: "i",
    };
  }

  if (target.amount !== undefined && target.amount !== null) {
    const amount = Number(target.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid target amount");
    }

    query.amount = amount;
  }

  if (target.type) {
    if (!["Income", "Expense"].includes(target.type)) {
      throw new Error("Invalid target transaction type");
    }

    query.type = target.type;
  }

  if (
    !target.category &&
    target.amount === undefined &&
    target.type === undefined
  ) {
    throw new Error("Please specify which transaction should be selected");
  }

  return query;
};

const updateTransaction = async ({ userId, target, changes }) => {
  if (!changes) {
    throw new Error("Update changes are required");
  }

  const query = buildTargetQuery(userId, target);

  const transactions = await Transaction.find(query).sort({
    date: -1,
    _id: -1,
  });

  if (!transactions.length) {
    throw new Error("No matching transaction found");
  }

  if (transactions.length > 1) {
    throw new Error(
      "Multiple matching transactions found. Please specify the transaction more clearly",
    );
  }

  if (
    changes.amount === undefined &&
    changes.category === undefined &&
    changes.type === undefined
  ) {
    throw new Error("No changes were provided");
  }

  const transaction = transactions[0];

  let newAmount = Number(transaction.amount);
  let newCategory = transaction.category;
  let newType = transaction.type;

  if (changes.amount !== undefined) {
    newAmount = Number(changes.amount);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
  }

  if (changes.category !== undefined) {
    newCategory = String(changes.category).trim();

    if (!newCategory) {
      throw new Error("Category cannot be empty");
    }
  }

  if (changes.type !== undefined) {
    if (!["Income", "Expense"].includes(changes.type)) {
      throw new Error("Invalid transaction type");
    }

    newType = changes.type;
  }

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

const findTransactionForDelete = async ({ userId, target }) => {
  const query = buildTargetQuery(userId, target);

  const transactions = await Transaction.find(query).sort({
    date: -1,
    _id: -1,
  });

  if (!transactions.length) {
    throw new Error("No matching transaction found");
  }

  // "last/latest" command
  if (target.latest === true) {
    return {
      multipleMatches: false,
      transaction: transactions[0],
    };
  }

  // Multiple matching transactions
  if (transactions.length > 1) {
    return {
      multipleMatches: true,
      count: transactions.length,
      transactions: transactions.slice(0, 5),
    };
  }

  return {
    multipleMatches: false,
    transaction: transactions[0],
  };
};

const deleteTransaction = async ({ userId, transactionId }) => {
  if (!transactionId) {
    throw new Error("Transaction ID is required");
  }

  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  await Transaction.deleteOne({
    _id: transactionId,
    user: userId,
  });

  return transaction;
};

module.exports = {
  getAvailableBalance,
  createTransaction,
  updateTransaction,
  findTransactionForDelete,
  deleteTransaction,
};
