import { useState } from "react";
import "./Dashboard.css";
import AddTransaction from "../Components/transaction/AddTransaction.jsx";
import StatsCards from "../Components/dashboard/StatsCards";
import ExpenseChart from "../Components/dashboard/ExpenseChart";
import RecentTransactions from "../Components/dashboard/RecentTransactions";

function Dashboard() {
  const [refresh, setRefresh] = useState(0);

  const handleAddTransaction = (newTransaction) => {
    const savedTransactions = JSON.parse(
      localStorage.getItem("transactions") || "[]",
    );

    const updatedTransactions = [
      ...savedTransactions,
      {
        ...newTransaction,
        id: Date.now(),
      },
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    localStorage.setItem("transactions", JSON.stringify(updatedTransactions));

    setRefresh((prev) => prev + 1);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>

        <AddTransaction onSave={handleAddTransaction} />
      </div>

      <StatsCards refresh={refresh} />

      <div className="dashboard-grid">
        <ExpenseChart refresh={refresh} />

        <RecentTransactions refresh={refresh} />
      </div>
    </div>
  );
}

export default Dashboard;
