import "./Budget.css";
import { useState } from "react";

import BudgetOverview from "../Components/budget/BudgetOverview";
import BudgetInsights from "../Components/budget/BudgetInsights";
import BudgetPlan from "../Components/budget/BudgetPlan";
import RecentSpending from "../Components/budget/RecentSpending";

function Budget() {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth()
  );

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("en-US", {
    month: "long",
  });
  const currentYear = currentDate.getFullYear();

  const selectedMonth = new Date(
    selectedYear,
    selectedMonthIndex
  ).toLocaleString("en-US", {
    month: "long",
  });

  const nextDate = new Date(
    currentYear,
    currentDate.getMonth() + 1,
    1
  );

  const nextMonth = nextDate.toLocaleString("en-US", {
    month: "long",
  });

  const nextYear = nextDate.getFullYear();

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

  const months = [
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
  ];

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
      (period) => period.label === selectedPeriod
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
        alert("Budget added successfully!");

        setShowModal(false);
        setAmount("");
        setSelectedPeriod("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Something went wrong");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setAmount("");
    setSelectedPeriod("");
  };

  return (
    <div className="budget-page">
      <div className="budget-top">
        <div>
          <h2>Budget</h2>
          <p>Manage your money with clarity and confidence.</p>
        </div>

        <div className="budget-top-actions">
          <button
            className="add-budget-btn"
            onClick={() => setShowModal(true)}
          >
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
                    {months.map((month, index) => (
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
                    onChange={(e) =>
                      setSelectedYear(Number(e.target.value))
                    }
                  >
                    {Array.from({ length: 11 }, (_, index) => {
                      const year = currentYear - 5 + index;

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
              <button className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>

              <button
                className="save-budget-btn"
                onClick={saveBudget}
              >
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}

      <BudgetOverview />

      <div className="budget-content">
        <div className="left-content">
          <BudgetInsights />
          <BudgetPlan />
        </div>

        <div className="right-content">
          <RecentSpending />

          <div className="goal-suggestion">
            <div className="goal-icon">◎</div>

            <div>
              <h3>Goal Suggestion</h3>

              <p>
                You can save more money this month by optimizing your
                expenses.
              </p>

              <button>Set Savings Goal</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Budget;