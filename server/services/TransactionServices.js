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

  const locked = goals.reduce(
    (sum, goal) => sum + Number(goal.savedAmount),
    0,
  );

  return balance - locked;
};

const createTransaction = async ({
  userId,
  category,
  type,
  amount,
  date,
}) => {
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
    category,
    type,
    amount: transactionAmount,
    date,
  });

  return transaction;
};

module.exports = {
  getAvailableBalance,
  createTransaction,
};