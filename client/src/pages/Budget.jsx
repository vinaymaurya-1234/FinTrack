import "./Budget.css";
import { useState, useEffect } from "react";

function Budget() {
  // Monthly budget modal
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryAmount, setCategoryAmount] = useState("");

  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);

  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth(),
  );

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const selectedMonth = new Date(
    selectedYear,
    selectedMonthIndex,
  ).toLocaleString("en-US", {
    month: "long",
  });

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
      month: selectedMonth,
      year: selectedYear,
      label: `${currentMonth} ${currentYear}`,
    },
    {
      month: nextMonth,
      year: nextYear,
      label: `${nextMonth} ${nextYear}`,
    },
  ];

  // Fetch monthly budget
  const fetchBudget = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch(
        `http://localhost:5000/api/budgets?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (response.ok) {
        setBudget(data.budget || data);
      } else {
        setBudget(null);
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
      setBudget(null);
    }
  };
  useEffect(() => {
    fetchBudget();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
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

  // Fetch budget categories
  const fetchBudgetCategories = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/budget-categories?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setBudgetCategories(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching budget categories:", error);
    }
  };

  useEffect(() => {
    fetchBudgetCategories();
  }, [selectedMonth, selectedYear]);

  // Current month transactions
  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return (
      transactionDate.getMonth() === selectedMonthIndex &&
      transactionDate.getFullYear() === selectedYear
    );
  });

  // Total expenses
  const totalSpent = selectedMonthTransactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => {
      return total + Number(transaction.amount);
    }, 0);

  // Total monthly budget
  const totalBudget = budget ? Number(budget.amount) : 0;

  // Remaining amount
  const remaining = totalBudget - totalSpent;

  // Percentage used
  const usedPercentage =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  // Save monthly budget
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

        fetchBudget();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  // Add budget category
  const addBudgetCategory = async () => {
    if (!categoryName || !categoryAmount) {
      alert("Please enter category name and amount");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/budget-categories",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            category: categoryName,
            amount: Number(categoryAmount),
            month: selectedMonth,
            year: currentYear,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Budget category added successfully!");

        setShowCategoryModal(false);
        setCategoryName("");
        setCategoryAmount("");

        fetchBudgetCategories();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error adding budget category:", error);
      alert("Something went wrong");
    }
  };

  // Get spending for a category
  const getCategorySpent = (category) => {
    return selectedMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          transaction.category.toLowerCase() === category.toLowerCase(),
      )
      .reduce((total, transaction) => {
        return total + Number(transaction.amount);
      }, 0);
  };

  // Category icon
  const getCategoryIcon = (category) => {
    const name = category.toLowerCase();

    if (name.includes("food")) return "🍔";
    if (name.includes("grocery")) return "🛒";
    if (name.includes("rent")) return "🏠";
    if (name.includes("transport")) return "🚕";
    if (name.includes("medicine")) return "💊";
    if (name.includes("shopping")) return "🛍️";

    return "📁";
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

          <div className="month-selector">
            <button
              className="month-btn"
              onClick={() => setShowMonthPicker(!showMonthPicker)}
            >
              📅 {selectedMonth} {selectedYear} ▼
            </button>

            {showMonthPicker && (
              <div className="month-picker-dropdown">
                <div className="picker-group">
                  <label>Month</label>

                  <select
                    value={selectedMonthIndex}
                    onChange={(e) =>
                      setSelectedMonthIndex(Number(e.target.value))
                    }
                  >
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((month, index) => (
                      <option key={month} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="picker-group">
                  <label>Year</label>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {Array.from({ length: 11 }, (_, index) => {
                      const year = new Date().getFullYear() - 5 + index;

                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  className="apply-month-btn"
                  onClick={() => setShowMonthPicker(false)}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Budget Modal */}
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

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="budget-modal-overlay">
          <div className="budget-modal">
            <h2>Add Budget Category</h2>

            <p>Allocate a part of your monthly budget.</p>

            <input
              type="text"
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Enter category budget"
              value={categoryAmount}
              onChange={(e) => setCategoryAmount(e.target.value)}
            />

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryName("");
                  setCategoryAmount("");
                }}
              >
                Cancel
              </button>

              <button className="save-budget-btn" onClick={addBudgetCategory}>
                Add Category
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

      {/* Bottom Sections */}
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
                <span>Remaining</span>
                <span>Progress</span>
                <span></span>
              </div>

              {budgetCategories.length > 0 ? (
                budgetCategories.map((category) => {
                  const spent = getCategorySpent(category.category);

                  const categoryBudget = Number(category.amount);

                  const actualProgress =
                    categoryBudget > 0 ? (spent / categoryBudget) * 100 : 0;

                  const remaining = categoryBudget - spent;

                  return (
                    <BudgetRow
                      key={category._id}
                      icon={getCategoryIcon(category.category)}
                      category={category.category}
                      type="Budget Category"
                      budget={categoryBudget}
                      spent={spent}
                      remaining={remaining}
                      progress={actualProgress}
                    />
                  );
                })
              ) : (
                <p
                  style={{
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  No budget categories added yet.
                </p>
              )}
            </div>

            <button
              className="add-category-btn"
              onClick={() => setShowCategoryModal(true)}
            >
              + Add Category
            </button>
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

            {selectedMonthTransactions
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

function BudgetRow({
  icon,
  category,
  type,
  budget,
  spent,
  remaining,
  progress,
}) {
  // Bar maximum 100% tak hi rahegi
  const progressWidth = Math.min(progress, 100);

  const isExceeded = progress > 100;

  return (
    <div className="budget-row">
      <div className="category-info">
        <div className="category-icon">{icon}</div>

        <div>
          <h4>{category}</h4>
          <p>{type}</p>
        </div>
      </div>

      <span>₹{Number(budget).toLocaleString()}</span>

      <span>₹{Number(spent).toLocaleString()}</span>

      <span>₹{Number(remaining).toLocaleString()}</span>

      <div className="progress-column">
        <span>
          {progress.toFixed(0)}%{isExceeded ? " Exceeded" : ""}
        </span>

        <div className="small-progress">
          <div
            style={{
              width: `${progressWidth}%`,
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
