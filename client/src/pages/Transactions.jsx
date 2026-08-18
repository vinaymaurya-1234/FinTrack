import { useEffect, useState } from "react";
import AddTransaction from "../Components/transaction/AddTransaction";
import "./Transactions.css";
import axios from "axios";

function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const getTransactions = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/transactions",
        );

        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    getTransactions();
  }, []);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const handleAddTransaction = async (newTransaction) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/transactions",
        newTransaction,
      );

      setTransactions((prev) => {
        const updatedTransactions = [...prev, response.data];

        return updatedTransactions.sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`);

      setTransactions((prev) =>
        prev.filter((transaction) => transaction._id !== id),
      );
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = async (updatedTransaction) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/transactions/${editingTransaction._id}`,
        updatedTransaction,
      );

      setTransactions((prev) => {
        const updatedTransactions = prev.map((transaction) =>
          transaction._id === editingTransaction._id
            ? response.data
            : transaction,
        );

        return updatedTransactions.sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
      });

      setEditingTransaction(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.category
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter = filter === "All" || transaction.type === filter;

    return matchesSearch && matchesFilter;
  });

  const visibleTransactions = filteredTransactions.slice(0, visibleCount);

  const handleViewMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleViewLess = () => {
    setVisibleCount(10);
  };

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h2>Transactions</h2>

        <AddTransaction
          onSave={handleAddTransaction}
          transactionToEdit={editingTransaction}
          onUpdate={handleUpdateTransaction}
          clearEdit={() => setEditingTransaction(null)}
        />
      </div>

      <div className="transactions-toolbar">
        <input
          type="text"
          placeholder="Search transactions..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="filter-buttons">
          <button
            className={filter === "All" ? "active" : ""}
            onClick={() => setFilter("All")}
          >
            All
          </button>

          <button
            className={filter === "Income" ? "active" : ""}
            onClick={() => setFilter("Income")}
          >
            Income
          </button>

          <button
            className={filter === "Expense" ? "active" : ""}
            onClick={() => setFilter("Expense")}
          >
            Expense
          </button>
        </div>
      </div>

      <div className="transactions-table">
        <div className="table-header">
          <span>Category</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        <div className="table-body">
          {visibleTransactions.map((transaction) => (
            <div className="table-row" key={transaction._id}>
              <span>{transaction.category}</span>

              <span
                className={transaction.type === "Income" ? "income" : "expense"}
              >
                {transaction.type}
              </span>

              <span className="amount">
                {transaction.type === "Income" ? "+ " : "- "}₹
                {transaction.amount}
              </span>

              <span>
                {new Date(transaction.date).toLocaleDateString("en-GB")}
              </span>

              <div className="actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditClick(transaction)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(transaction._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="no-transactions">No transactions found</div>
          )}
        </div>
      </div>

      {filteredTransactions.length > 10 && (
        <div className="transaction-pagination">
          <p>
            Showing {Math.min(visibleCount, filteredTransactions.length)} of{" "}
            {filteredTransactions.length} transactions
          </p>

          <div className="view-buttons">
            {visibleCount > 10 && (
              <button onClick={handleViewLess}>↑ View Less</button>
            )}

            {visibleCount < filteredTransactions.length && (
              <button onClick={handleViewMore}>View More ↓</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
