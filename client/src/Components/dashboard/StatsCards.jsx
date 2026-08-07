import "./StatsCards.css";
import {
  FaWallet,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaPiggyBank,
} from "react-icons/fa6";

function StatsCards() {
  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="card-top">
          <h4>Total Balance</h4>
          <FaWallet className="card-icon balance" />
        </div>

        <h2>₹54,000</h2>

        <p className="card-info">+12% this month</p>
      </div>

      <div className="stat-card">
        <div className="card-top">
          <h4>Income</h4>
          <FaArrowTrendUp className="card-icon income" />
        </div>

        <h2>₹80,000</h2>

        <p className="card-info">Salary & Freelance</p>
      </div>

      <div className="stat-card">
        <div className="card-top">
          <h4>Expenses</h4>
          <FaArrowTrendDown className="card-icon expense" />
        </div>

        <h2>₹26,000</h2>

        <p className="card-info">-8% this month</p>
      </div>

      <div className="stat-card">
        <div className="card-top">
          <h4>Savings</h4>
          <FaPiggyBank className="card-icon saving" />
        </div>

        <h2>₹28,000</h2>

        <p className="card-info">Goal 70%</p>
      </div>
    </div>
  );
}

export default StatsCards;
