import "./ExpenseChart.css";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", expense: 12000 },
  { month: "Feb", expense: 18000 },
  { month: "Mar", expense: 15000 },
  { month: "Apr", expense: 22000 },
  { month: "May", expense: 17000 },
  { month: "Jun", expense: 26000 },
];

function ExpenseChart() {
  return (
    <div className="expense-chart">
      <div className="chart-header">
        <h3>Expense Overview</h3>

        <select>
          <option>This Year</option>
          <option>This Month</option>
          <option>This Week</option>

        </select>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <XAxis dataKey="month" />
            <Tooltip />
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