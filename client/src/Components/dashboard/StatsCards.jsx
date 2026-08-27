import "./StatsCards.css";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaWallet,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaPiggyBank,
} from "react-icons/fa6";

function StatsCards({ refresh }) {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const getData = async () => {
      try {
        const [transactionRes, goalRes] = await Promise.all([
          axios.get("http://localhost:5000/api/transactions", config),
          axios.get("http://localhost:5000/api/goals", config),
        ]);

        setTransactions(transactionRes.data);
        setGoals(goalRes.data);
      } catch (error) {
        console.log(error);
      }
    };

    getData();
  }, [refresh]);

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  // Total money in the account
  const totalBalance = totalIncome - totalExpense;

  // Money reserved in all goals
  const reservedGoalAmount = goals.reduce(
    (total, goal) => total + Number(goal.savedAmount),
    0,
  );

  // Money available for normal spending
  const availableBalance = totalBalance - reservedGoalAmount;

  return (
    <div className="stats-cards">
      {/* Available for Spend */}
      <div className="stat-card">
        <div className="card-top">
          <h4>Available for Spend</h4>
          <FaWallet className="card-icon balance" />
        </div>

        <h2>₹{availableBalance.toLocaleString("en-IN")}</h2>

        <p className="card-info">Spendable balance</p>
      </div>

      {/* Income */}
      <div className="stat-card">
        <div className="card-top">
          <h4>Income</h4>
          <FaArrowTrendUp className="card-icon income" />
        </div>

        <h2>₹{totalIncome.toLocaleString("en-IN")}</h2>

        <p className="card-info">Total income</p>
      </div>

      {/* Expenses */}
      <div className="stat-card">
        <div className="card-top">
          <h4>Expenses</h4>
          <FaArrowTrendDown className="card-icon expense" />
        </div>

        <h2>₹{totalExpense.toLocaleString("en-IN")}</h2>

        <p className="card-info">Total expenses</p>
      </div>

      {/* Total Net Balance */}
      <div className="stat-card">
        <div className="card-top">
          <h4>Total Net Balance</h4>
          <FaPiggyBank className="card-icon saving" />
        </div>

        <h2>₹{totalBalance.toLocaleString("en-IN")}</h2>

        <p className="card-info">Including reserved goals</p>
      </div>
    </div>
  );
}

export default StatsCards;
