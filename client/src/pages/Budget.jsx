import "./Budget.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";
import BudgetOverview from "../Components/budget/BudgetOverview";
import BudgetInsights from "../Components/budget/BudgetInsights";
import BudgetPlan from "../Components/budget/BudgetPlan";
import RecentSpending from "../Components/budget/RecentSpending";

function Budget() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  // Month picker
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Actual applied month/year
  // Page initially current month show karega
  const [selectedMonthIndex, setSelectedMonthIndex] =
    useState(currentMonthIndex);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Temporary month/year
  // Dropdown ke andar use hoga
  const [tempMonthIndex, setTempMonthIndex] = useState(currentMonthIndex);

  const [tempYear, setTempYear] = useState(currentYear);

  // Current month name
  const currentMonth = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  // Applied selected month name
  const selectedMonth = new Date(
    selectedYear,
    selectedMonthIndex,
  ).toLocaleString("en-US", {
    month: "long",
  });

  // Next month
  const nextDate = new Date(currentYear, currentMonthIndex + 1, 1);

  const nextMonth = nextDate.toLocaleString("en-US", {
    month: "long",
  });

  const nextYear = nextDate.getFullYear();

  // Budget periods
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

  // Save Budget
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
      const response = await fetch(`${API_URL}/budgets`, {
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

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setAmount("");
    setSelectedPeriod("");
  };

  // Open month picker
  const handleMonthPicker = () => {
    // Current applied value temporary state me set karo
    setTempMonthIndex(selectedMonthIndex);
    setTempYear(selectedYear);

    setShowMonthPicker(!showMonthPicker);
  };

  // Apply selected month/year
  const applyMonthFilter = () => {
    // Actual page data ab change hoga
    setSelectedMonthIndex(tempMonthIndex);
    setSelectedYear(tempYear);

    setShowMonthPicker(false);
  };

  return (
    <div className="budget-page">
      {/* ================= TOP SECTION ================= */}

      <div className="budget-top">
        <div>
          <h2>Budget</h2>
          <p>Manage your money with clarity and confidence.</p>
        </div>

        <div className="budget-top-actions">
          {/* ADD BUDGET BUTTON */}

          <button className="add-budget-btn" onClick={() => setShowModal(true)}>
            + Add Budget
          </button>

          {/* MONTH SELECTOR */}

          <div className="month-selector">
            <button className="month-btn" onClick={handleMonthPicker}>
              📅 {selectedMonth} {selectedYear} ▼
            </button>

            {showMonthPicker && (
              <div className="month-picker-dropdown">
                {/* MONTH */}

                <div className="picker-group">
                  <label>Month</label>

                  <select
                    value={tempMonthIndex}
                    onChange={(e) => setTempMonthIndex(Number(e.target.value))}
                  >
                    {months.map((month, index) => (
                      <option key={month} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                {/* YEAR */}

                <div className="picker-group">
                  <label>Year</label>

                  <select
                    value={tempYear}
                    onChange={(e) => setTempYear(Number(e.target.value))}
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

                {/* APPLY */}

                <button className="apply-month-btn" onClick={applyMonthFilter}>
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= ADD BUDGET MODAL ================= */}

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

              <button className="save-budget-btn" onClick={saveBudget}>
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BUDGET OVERVIEW ================= */}

      <BudgetOverview
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedMonthIndex={selectedMonthIndex}
      />

      {/* ================= MAIN CONTENT ================= */}

      <div className="budget-content">
        {/* LEFT SIDE */}

        <div className="left-content">
          <BudgetInsights
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedMonthIndex={selectedMonthIndex}
          />

          <BudgetPlan
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedMonthIndex={selectedMonthIndex}
          />
        </div>

        {/* RIGHT SIDE */}

        <div className="right-content">
          <RecentSpending
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedMonthIndex={selectedMonthIndex}
          />

          <div className="goal-suggestion">
            <div className="goal-icon">◎</div>

            <div>
              <h3>Goal Suggestion</h3>

              <p>
                You can save more money this month by optimizing your expenses.
              </p>

              <button onClick={() => navigate("/goals")}>
                Set Savings Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Budget;
