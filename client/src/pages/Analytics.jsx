import { useEffect, useState } from "react";
import axios from "axios";
import "./Analytics.css";

function Analytics() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const getTransactions = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/transactions",
          config,
        );

        setTransactions(
          Array.isArray(response.data)
            ? response.data
            : response.data.transactions || [],
        );
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    getTransactions();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Daily spending
  const dailySpending = {};

  for (let day = 1; day <= daysInMonth; day++) {
    dailySpending[day] = 0;
  }

  transactions.forEach((transaction) => {
    if (transaction.type !== "Expense") return;

    const date = new Date(transaction.date);

    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      dailySpending[day] += Number(transaction.amount) || 0;
    }
  });

  const spendingDays = Object.entries(dailySpending)
    .filter(([_, amount]) => amount > 0)
    .map(([day, amount]) => ({
      day: Number(day),
      amount,
    }));

  const totalSpent = spendingDays.reduce(
    (total, item) => total + item.amount,
    0,
  );

  const highestDay =
    spendingDays.length > 0
      ? spendingDays.reduce((max, item) =>
          item.amount > max.amount ? item : max,
        )
      : null;

  const lowestDay =
    spendingDays.length > 0
      ? spendingDays.reduce((min, item) =>
          item.amount < min.amount ? item : min,
        )
      : null;

  const averageDailySpend = totalSpent / daysInMonth;

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar days
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Spending intensity
  const maxSpending = Math.max(...Object.values(dailySpending));

  const getIntensity = (amount) => {
    if (amount === 0 || maxSpending === 0) return 0;

    const percentage = amount / maxSpending;

    if (percentage <= 0.2) return 1;
    if (percentage <= 0.4) return 2;
    if (percentage <= 0.6) return 3;
    if (percentage <= 0.8) return 4;

    return 5;
  };

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand your spending behavior.</p>
        </div>

        <div className="month-navigation">
          <button onClick={previousMonth}>‹</button>

          <span>
            {monthName} {year}
          </span>

          <button onClick={nextMonth}>›</button>
        </div>
      </div>

      {/* Calendar */}
      <div className="analytics-calendar-card">
        <div className="calendar-header">
          <h2>Spending Calendar</h2>

          <span>
            {monthName} {year}
          </span>
        </div>

        <div className="weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div key={`empty-${index}`} className="calendar-day empty" />
              );
            }

            const amount = dailySpending[day];
            const intensity = getIntensity(amount);

            return (
              <div key={day} className={`calendar-day intensity-${intensity}`}>
                <span className="day-number">{day}</span>

                <span className="day-amount">
                  ₹{amount.toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <span>Less Spending</span>

          <div className="legend-boxes">
            <i className="intensity-1"></i>
            <i className="intensity-2"></i>
            <i className="intensity-3"></i>
            <i className="intensity-4"></i>
            <i className="intensity-5"></i>
          </div>

          <span>More Spending</span>
        </div>
      </div>

      {/* Summary */}
      <div className="analytics-summary">
        <div className="summary-item">
          <span>Highest Spending Day</span>

          <strong>
            {highestDay
              ? `${highestDay.day} ${monthName} ${year}`
              : "No spending"}
          </strong>

          <b>
            {highestDay
              ? `₹${highestDay.amount.toLocaleString("en-IN")}`
              : "₹0"}
          </b>
        </div>

        <div className="summary-item">
          <span>Lowest Spending Day</span>

          <strong>
            {lowestDay
              ? `${lowestDay.day} ${monthName} ${year}`
              : "No spending"}
          </strong>

          <b>
            {lowestDay ? `₹${lowestDay.amount.toLocaleString("en-IN")}` : "₹0"}
          </b>
        </div>

        <div className="summary-item">
          <span>Average Daily Spend</span>

          <strong>
            ₹{Math.round(averageDailySpend).toLocaleString("en-IN")}
          </strong>

          <small>Across {daysInMonth} days</small>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
