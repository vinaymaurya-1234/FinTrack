import { useEffect, useState } from "react";
import axios from "axios";
import "./ExpenseChart.css";
import { API_URL } from "../../api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function ExpenseChart() {
  const [period, setPeriod] = useState("year");
  const [transactions, setTransactions] = useState([]);

  // Fetch transactions from backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API_URL}/api/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setTransactions(response.data);
      })
      .catch((error) => {
        console.log("Error fetching transactions:", error);
      });
  }, []);

  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "Expense",
  );

  const getAmount = (transaction) => {
    return Number(transaction.amount) || 0;
  };

  let chartData = [];

  // =========================
  // THIS WEEK
  // =========================
  if (period === "week") {
    const today = new Date();

    chartData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);

      date.setDate(today.getDate() - (6 - index));

      const totalExpense = expenseTransactions
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);

          return (
            transactionDate.getFullYear() === date.getFullYear() &&
            transactionDate.getMonth() === date.getMonth() &&
            transactionDate.getDate() === date.getDate()
          );
        })
        .reduce((total, transaction) => total + getAmount(transaction), 0);

      return {
        month: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        expense: totalExpense,
      };
    });
  }

  // =========================
  // THIS MONTH
  // =========================
  else if (period === "month") {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    chartData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      const totalExpense = expenseTransactions
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);

          return (
            transactionDate.getFullYear() === year &&
            transactionDate.getMonth() === month &&
            transactionDate.getDate() === day
          );
        })
        .reduce((total, transaction) => total + getAmount(transaction), 0);

      return {
        month: day,
        expense: totalExpense,
      };
    });
  }

  // =========================
  // THIS YEAR
  // =========================
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
        .reduce((total, transaction) => total + getAmount(transaction), 0);

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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 15,
              right: 20,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="month" axisLine={false} tickLine={false} />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${value}`}
            />

            <Tooltip
              formatter={(value) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                "Expense",
              ]}
            />

            <Area
              type="monotone"
              dataKey="expense"
              stroke="#6D5EF8"
              fill="#6D5EF8"
              fillOpacity={0.2}
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ExpenseChart;
