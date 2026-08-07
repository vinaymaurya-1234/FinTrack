import "./Transactions.css";

function Transactions() {
  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h2>Transactions</h2>

        <div className="transactions-toolbar">
          <input
            type="text"
            placeholder="🔍 Search transactions..."
            className="search-input"
          />

          <div className="filter-buttons">
            <button className="active">All</button>
            <button>Income</button>
            <button>Expense</button>
          </div>
        </div>

        <button className="add-btn">+ Add Transaction</button>

        <div className="transactions-table">
          <div className="table-header">
            <span>Category</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Date</span>
            <span>Actions</span>
          </div>

          <div className="table-body">
            {/* Dummy Row */}

            <div className="table-row">
              <span>🍔 Food</span>
              <span className="expense">Expense</span>
              <span>₹450</span>
              <span>08 Aug 2026</span>

              <div className="actions">
                <button>Edit</button>
                <button>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transactions;
