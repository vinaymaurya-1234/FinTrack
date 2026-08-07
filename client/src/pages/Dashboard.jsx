import "./Dashboard.css";
import AddTransaction from "../Components/transaction/AddTransaction.jsx";
import StatsCards from "../Components/dashboard/StatsCards";
import ExpenseChart from "../Components/dashboard/ExpenseChart";
import RecentTransactions from "../Components/dashboard/RecentTransactions";

function Dashboard() {
  return (
    <>
      <div className="dashboard-header">
        <h1>Dashboard</h1>

        <AddTransaction />
      </div>

      <StatsCards />

      <div className="dashboard-grid">
        <ExpenseChart />
        <RecentTransactions />
      </div>
    </>
  );
}

export default Dashboard;
