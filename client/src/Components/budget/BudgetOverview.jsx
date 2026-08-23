import { useEffect, useState } from "react";
import "./BudgetOverview.css";

function BudgetOverview() {
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const currentDate = new Date();

  const selectedMonth = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  const selectedYear = currentDate.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const budgetResponse = await fetch(
          `http://localhost:5000/api/budgets?month=${selectedMonth}&year=${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const budgetData = await budgetResponse.json();

        if (budgetResponse.ok) {
          setBudget(budgetData.budget || budgetData);
        }

        const transactionResponse = await fetch(
          "http://localhost:5000/api/transactions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const transactionData = await transactionResponse.json();

        if (transactionResponse.ok) {
          setTransactions(transactionData);
        }
      } catch (error) {
        console.error("Error fetching overview data:", error);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const totalSpent = selectedMonthTransactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  const totalBudget = budget ? Number(budget.amount) : 0;

  const totalRemaining = totalBudget - totalSpent;

  const usedPercentage =
    totalBudget > 0
      ? Math.min((totalSpent / totalBudget) * 100, 100)
      : 0;

  return (
    <div className="budget-overview">
      <div className="budget-progress-section">
        <div className="budget-title">
          <h3>Monthly Budget Progress</h3>

          <span>
            {selectedMonth} {selectedYear}
          </span>
        </div>

        <h1>₹{totalSpent.toLocaleString()}</h1>

        <p className="budget-label">
          of ₹{totalBudget.toLocaleString()} budget
        </p>

        <div className="budget-progress-bar">
          <div
            className="budget-progress-fill"
            style={{
              width: `${usedPercentage}%`,
            }}
          ></div>
        </div>

        <div className="budget-progress-info">
          <span>{usedPercentage.toFixed(0)}% Used</span>

          <span>
            ₹{Math.max(totalRemaining, 0).toLocaleString()} Left
          </span>
        </div>
      </div>

      <div className="budget-circle">
        <div
          className="circle-content"
          style={{
            background:
              usedPercentage === 0
                ? "#eef0f6"
                : `conic-gradient(
                    #6d5ef8 ${usedPercentage}%,
                    #eef0f6 ${usedPercentage}% 100%
                  )`,
          }}
        >
          <h2>{usedPercentage.toFixed(0)}%</h2>
          <span>of budget</span>
          <span>used</span>
        </div>
      </div>

      <div className="budget-summary">
        <h3>Summary</h3>

        <div className="summary-box">
          <div className="summary-row">
            <span>
              <i className="dot purple"></i>
              Total Budget
            </span>

            <strong>₹{totalBudget.toLocaleString()}</strong>
          </div>

          <div className="summary-row">
            <span>
              <i className="dot pink"></i>
              Total Spent
            </span>

            <strong>₹{totalSpent.toLocaleString()}</strong>
          </div>

          <div className="summary-row">
            <span>
              <i className="dot green"></i>
              Remaining
            </span>

            <strong>₹{totalRemaining.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="budget-message">
        <div className="wallet-icon">💼</div>

        <p>
          “A budget is telling your money where to go instead of wondering
          where it went.”
        </p>
      </div>
    </div>
  );
}

export default BudgetOverview;