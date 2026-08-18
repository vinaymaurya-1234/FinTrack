import { useState } from "react";
import "./ExpenseChart.css";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

function ExpenseChart() {
  const [period, setPeriod] = useState("year");

  const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "Expense",
  );

  let chartData = [];

  // THIS WEEK
  if (period === "week") {
    const today = new Date();

    chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - index));

      const dateString = date.toISOString().split("T")[0];

      const totalExpense = expenseTransactions
        .filter((transaction) => transaction.date === dateString)
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        month: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        expense: totalExpense,
      };
    });
  }

  // THIS MONTH
  else if (period === "month") {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    chartData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;

      const totalExpense = expenseTransactions
        .filter((transaction) => transaction.date === dateString)
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        month: day,
        expense: totalExpense,
      };
    });
  }

  // THIS YEAR
  else {
    const year = new Date().getFullYear();

    chartData = Array.from({ length: 12 }, (_, index) => {
      const totalExpense = expenseTransactions
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);

          return (
            transactionDate.getFullYear() === year &&
            transactionDate.getMonth() === index
          );
        })
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        month: new Date(year, index).toLocaleString("en-IN", {
          month: "short",
        }),
        expense: totalExpense,
      };
    });
  }

  return (
    <div className="expense-chart">
      <div className="chart-header">
        <h3>Expense Overview</h3>

        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="year">This Year</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <XAxis dataKey="month" />

            <Tooltip
              formatter={(value) => [
                `₹${value.toLocaleString("en-IN")}`,
                "Expense",
              ]}
            />

            <Area
              type="monotone"
              dataKey="expense"
              stroke="#6D5EF8"
              fill="#6D5EF8"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ExpenseChart;
