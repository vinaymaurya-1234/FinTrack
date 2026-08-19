import "./Budget.css";
import { useState, useEffect } from "react";

function Budget() {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Current month
  const currentDate = new Date();

  const currentMonth = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  const currentYear = currentDate.getFullYear();

  // Next month
  const nextDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    1,
  );

  const nextMonth = nextDate.toLocaleString("en-US", {
    month: "long",
  });

  const nextYear = nextDate.getFullYear();

  // Current + next month
  const budgetPeriods = [
    {
      month: currentMonth,
      year: currentYear,
      label: `${currentMonth} ${currentYear}`,
    },
    {
      month: nextMonth,
      year: nextYear,
      label: `${nextMonth} ${nextYear}`,
    },
  ];

  // Fetch current month budget
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await fetch(
          `http://localhost:5000/api/budgets?month=${currentMonth}&year=${currentYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (response.ok) {
          setBudget(data);
        }
      } catch (error) {
        console.error("Error fetching budget:", error);
      }
    };

    fetchBudget();
  }, [currentMonth, currentYear]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await fetch("http://localhost:5000/api/transactions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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

  // Current month transactions
  const currentMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Total expenses
  const totalSpent = currentMonthTransactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => {
      return total + Number(transaction.amount);
    }, 0);

  // Budget
  const totalBudget = budget ? Number(budget.amount) : 0;

  // Remaining amount
  const remaining = totalBudget - totalSpent;

  // Percentage used
  const usedPercentage =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // Save budget
  const saveBudget = async () => {
    if (!amount || !selectedPeriod) {
      alert("Please enter amount and select a budget period");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    const selectedBudget = budgetPeriods.find(
      (period) => period.label === selectedPeriod,
    );

    try {
      const response = await fetch("http://localhost:5000/api/budgets", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          amount: Number(amount),
          month: selectedBudget.month,
          year: selectedBudget.year,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBudget(data.budget);

        alert("Budget added successfully!");

        setShowModal(false);
        setAmount("");
        setSelectedPeriod("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="budget-page">
      {/* Top Header */}
      <div className="budget-top">
        <div>
          <h2>Budget</h2>
          <p>Manage your money with clarity and confidence.</p>
        </div>

        <div className="budget-top-actions">
          <button className="add-budget-btn" onClick={() => setShowModal(true)}>
            + Add Budget
          </button>

          <button className="month-btn">📅 This Month</button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="budget-modal-overlay">
          <div className="budget-modal">
            <h2>Add Monthly Budget</h2>

            <p>Set your budget for the current or next month.</p>

            <input
              type="number"
              placeholder="Enter budget amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="">Select Budget Period</option>

              {budgetPeriods.map((period) => (
                <option key={period.label} value={period.label}>
                  {period.label}
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button className="save-budget-btn" onClick={saveBudget}>
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Budget Overview */}
      <div className="budget-overview">
        {/* Monthly Budget Progress */}
        <div className="budget-progress-section">
          <div className="budget-title">
            <h3>Monthly Budget Progress</h3>

            <span>
              {currentMonth} {currentYear}
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

            <span>₹{Math.max(remaining, 0).toLocaleString()} Left</span>
          </div>
        </div>

        {/* Budget Usage Circle */}
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

        {/* Summary */}
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

              <strong>₹{remaining.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Right Message */}
        <div className="budget-message">
          <div className="wallet-icon">💼</div>

          <p>
            “A budget is telling your money where to go instead of wondering
            where it went.”
          </p>
        </div>
      </div>

      {/* Bottom sections */}
      <div className="budget-content">
        <div className="left-content">
          {/* Budget Insights */}
          <div className="budget-insights">
            <h3>Budget Insights</h3>

            <div className="insight-list">
              <div className="insight">
                <div className="insight-icon success">↗</div>

                <div>
                  <h4>You're on track!</h4>
                  <p>
                    Keep tracking your spending and stay within your budget.
                  </p>
                </div>
              </div>

              <div className="insight">
                <div className="insight-icon warning">⌁</div>

                <div>
                  <h4>Watch out</h4>

                  <p>
                    You've used {usedPercentage.toFixed(0)}% of your monthly
                    budget.
                  </p>
                </div>
              </div>

              <div className="insight">
                <div className="insight-icon info">i</div>

                <div>
                  <h4>Tip for you</h4>

                  <p>Try setting limits for your variable expenses.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Plan */}
          <div className="budget-plan">
            <div className="section-header">
              <h3>Your Budget Plan</h3>

              <button>Manage Categories</button>
            </div>

            <div className="budget-table">
              <div className="budget-table-header">
                <span>Category</span>
                <span>Budget</span>
                <span>Spent</span>
                <span>Limit</span>
                <span>Progress</span>
                <span></span>
              </div>

              <BudgetRow
                icon="🏠"
                category="Rent"
                type="Fixed Expense"
                budget="₹15,000"
                spent="₹15,000"
                progress="100%"
              />

              <BudgetRow
                icon="🛒"
                category="Groceries"
                type="Variable Expense"
                budget="₹6,000"
                spent="₹3,240"
                progress="54%"
              />

              <BudgetRow
                icon="🚕"
                category="Transportation"
                type="Variable Expense"
                budget="₹4,000"
                spent="₹2,350"
                progress="58%"
              />

              <BudgetRow
                icon="💊"
                category="Medicine"
                type="Variable Expense"
                budget="₹2,000"
                spent="₹1,780"
                progress="89%"
              />

              <BudgetRow
                icon="•••"
                category="Personal & Others"
                type="Flexible Expense"
                budget="₹5,000"
                spent="₹1,430"
                progress="29%"
              />
            </div>

            <button className="add-category-btn">+ Add Category</button>
          </div>
        </div>

        {/* Right Side */}
        <div className="right-content">
          {/* Recent Spending */}
          <div className="recent-spending">
            <div className="section-header">
              <h3>Recent Spending</h3>

              <button>View All</button>
            </div>

            {currentMonthTransactions
              .filter((transaction) => transaction.type === "Expense")
              .slice(0, 4)
              .map((transaction) => (
                <SpendingItem
                  key={transaction._id}
                  icon="💸"
                  name={transaction.category}
                  category={transaction.category}
                  amount={`- ₹${Number(transaction.amount).toLocaleString()}`}
                  date={new Date(transaction.date).toLocaleDateString()}
                />
              ))}
          </div>

          {/* Goal Suggestion */}
          <div className="goal-suggestion">
            <div className="goal-icon">◎</div>

            <div>
              <h3>Goal Suggestion</h3>

              <p>
                You can save more money this month by optimizing your expenses.
              </p>

              <button>Set Savings Goal</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Budget Row */

function BudgetRow({ icon, category, type, budget, spent, progress }) {
  return (
    <div className="budget-row">
      <div className="category-info">
        <div className="category-icon">{icon}</div>

        <div>
          <h4>{category}</h4>
          <p>{type}</p>
        </div>
      </div>

      <span>{budget}</span>

      <span>{spent}</span>

      <span>{budget}</span>

      <div className="progress-column">
        <span>{progress}</span>

        <div className="small-progress">
          <div
            style={{
              width: progress,
            }}
          ></div>
        </div>
      </div>

      <button className="row-menu">⋮</button>
    </div>
  );
}

/* Recent Spending Item */

function SpendingItem({ icon, name, category, amount, date }) {
  return (
    <div className="spending-item">
      <div className="spending-left">
        <div className="spending-icon">{icon}</div>

        <div>
          <h4>{name}</h4>

          <p>
            {category} • {date}
          </p>
        </div>
      </div>

      <strong>{amount}</strong>
    </div>
  );
}

export default Budget;
