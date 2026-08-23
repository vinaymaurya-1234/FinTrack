import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SpendingItem from "./SpendingItem";
import "./RecentSpending.css";

function RecentSpending() {
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await fetch(
          "http://localhost:5000/api/transactions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setTransactions(data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, []);

  const currentDate = new Date();

  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const getCategoryIcon = (category) => {
    const name = category.toLowerCase();

    if (name.includes("food")) return "🍔";
    if (name.includes("grocery")) return "🛒";
    if (name.includes("rent")) return "🏠";
    if (name.includes("travel")) return "✈️";
    if (name.includes("transport")) return "🚕";
    if (name.includes("medical") || name.includes("medicine")) return "💊";
    if (name.includes("bill") || name.includes("utility")) return "💡";
    if (name.includes("shopping")) return "🛍️";
    if (name.includes("fitness") || name.includes("gym")) return "🏋️";
    if (name.includes("entertainment")) return "🎬";
    if (name.includes("education")) return "📚";
    if (name.includes("other")) return "📦";

    return "📌";
  };

  return (
    <div className="recent-spending">
      <div className="section-header">
        <h3>Recent Spending</h3>

        <button onClick={() => navigate("/transactions")}>
          View All
        </button>
      </div>

      {selectedMonthTransactions
        .filter((transaction) => transaction.type === "Expense")
        .slice(0, 6)
        .map((transaction) => (
          <SpendingItem
            key={transaction._id}
            icon={getCategoryIcon(transaction.category)}
            name={transaction.category}
            category={transaction.category}
            amount={`- ₹${Number(transaction.amount).toLocaleString()}`}
            date={new Date(transaction.date).toLocaleDateString()}
          />
        ))}
    </div>
  );
}

export default RecentSpending;