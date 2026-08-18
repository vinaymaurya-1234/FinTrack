import "./StatsCards.css";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaWallet,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaPiggyBank,
} from "react-icons/fa6";

function StatsCards() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/transactions")
      .then((response) => {
        setTransactions(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  const totalSavings = totalBalance;

  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="card-top">
          <h4>Total Balance</h4>
          <FaWallet className="card-icon balance" />
        </div>

        <h2>₹{totalBalance.toLocaleString("en-IN")}</h2>

        <p className="card-info">Current balance</p>
      </div>

      <div className="stat-card">
        <div className="card-top">
          <h4>Income</h4>
          <FaArrowTrendUp className="card-icon income" />
        </div>

        <h2>₹{totalIncome.toLocaleString("en-IN")}</h2>

        <p className="card-info">Total income</p>
      </div>

      <div className="stat-card">
        <div className="card-top">
          <h4>Expenses</h4>
          <FaArrowTrendDown className="card-icon expense" />
        </div>

        <h2>₹{totalExpense.toLocaleString("en-IN")}</h2>

        <p className="card-info">Total expenses</p>
      </div>

      <div className="stat-card">
        <div className="card-top">
          <h4>Savings</h4>
          <FaPiggyBank className="card-icon saving" />
        </div>

        <h2>₹{totalSavings.toLocaleString("en-IN")}</h2>

        <p className="card-info">Available savings</p>
      </div>
    </div>
  );
}

export default StatsCards;
