import "./RecentTransactions.css";

function RecentTransactions() {
  return (
    <div className="recent-transactions">

      <h3>Recent Transactions</h3>

      <div className="transaction-item">
        <div>
          <h4>Amazon</h4>
          <p>Shopping</p>
        </div>

        <span>- ₹1,200</span>
      </div>

      <div className="transaction-item">
        <div>
          <h4>Salary</h4>
          <p>Income</p>
        </div>

        <span className="income">+ ₹50,000</span>
      </div>

      <div className="transaction-item">
        <div>
          <h4>Swiggy</h4>
          <p>Food</p>
        </div>

        <span>- ₹450</span>
      </div>

    </div>
  );
}

export default RecentTransactions;