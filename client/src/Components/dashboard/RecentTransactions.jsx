import "./RecentTransactions.css";

function RecentTransactions() {
  const transactions = JSON.parse(
    localStorage.getItem("transactions") || "[]",
  );

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="recent-transactions">
      <h3>Recent Transactions</h3>

      {recentTransactions.length === 0 ? (
        <p className="no-recent-transactions">
          No transactions yet
        </p>
      ) : (
        recentTransactions.map((transaction) => (
          <div
            className="transaction-item"
            key={transaction.id}
          >
            <div>
              <h4>{transaction.category}</h4>
              <p>
                {transaction.date
                  .split("-")
                  .reverse()
                  .join("-")}
              </p>
            </div>

            <span
              className={
                transaction.type === "Income" ? "income" : ""
              }
            >
              {transaction.type === "Income" ? "+ " : "- "}₹
              {transaction.amount}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export default RecentTransactions;