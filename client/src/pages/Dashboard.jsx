import { useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import AddTransaction from "../Components/transaction/AddTransaction.jsx";
import StatsCards from "../Components/dashboard/StatsCards";
import ExpenseChart from "../Components/dashboard/ExpenseChart";
import RecentTransactions from "../Components/dashboard/RecentTransactions";

function Dashboard() {
  const [refresh, setRefresh] = useState(0);

  const handleAddTransaction = async (newTransaction) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/transactions",
        newTransaction,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        {/* <h1>Dashboard</h1> */}

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
