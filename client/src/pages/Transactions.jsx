import { useEffect, useState } from "react";
import AddTransaction from "../Components/transaction/AddTransaction";
import "./Transactions.css";

function Transactions() {
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem("transactions");

    return savedTransactions
      ? JSON.parse(savedTransactions)
      : [
          {
            id: 1,
            category: "🍔 Food",
            type: "Expense",
            amount: 450,
            date: "2026-08-08",
          },
        ];
  });

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleAddTransaction = (newTransaction) => {
    setTransactions((prev) => {
      const updatedTransactions = [
        ...prev,
        {
          ...newTransaction,
          id: Date.now(),
        },
      ];

      return updatedTransactions.sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
    });
  };

  const handleDelete = (id) => {
    const updatedTransactions = transactions.filter(
      (transaction) => transaction.id !== id,
    );

    setTransactions(updatedTransactions);
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = (updatedTransaction) => {
    setTransactions((prev) => {
      const updatedTransactions = prev.map((transaction) =>
        transaction.id === editingTransaction.id
          ? {
              ...updatedTransaction,
              id: editingTransaction.id,
            }
          : transaction,
      );

      return updatedTransactions.sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
    });

    setEditingTransaction(null);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.category
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter = filter === "All" || transaction.type === filter;

    return matchesSearch && matchesFilter;
  });

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
          {filteredTransactions.map((transaction) => (
            <div className="table-row" key={transaction.id}>
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

              <span>{transaction.date.split("-").reverse().join("-")}</span>

              <div className="actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditClick(transaction)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(transaction.id)}
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
    </div>
  );
}

export default Transactions;
