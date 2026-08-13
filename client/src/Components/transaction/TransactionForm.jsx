import "./TransactionForm.css";
import { expenseCategories, incomeCategories } from "../../utils/categories";
import { useState } from "react";

function TransactionForm({ closeModal, onSave, transactionToEdit }) {
  const [type, setType] = useState(transactionToEdit?.type || "Expense");
  const [category, setCategory] = useState(transactionToEdit?.category || "");
  const [amount, setAmount] = useState(transactionToEdit?.amount || "");
  const [date, setDate] = useState(transactionToEdit?.date || "");
  const [note, setNote] = useState(transactionToEdit?.note || "");

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const categories = type === "Expense" ? expenseCategories : incomeCategories;

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setCategory("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Date required
    if (!date) {
      alert("Please select a date.");
      return;
    }

    // Prevent future dates
    if (date > todayString) {
      alert("Future dates are not allowed.");
      return;
    }

    // Amount required
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const newTransaction = {
      category,
      type,
      amount: Number(amount),
      date,
      note,
    };

    onSave(newTransaction);

    closeModal();
  };

  return (
    <div className="modal-overlay">
      <div className="transaction-modal">
        <div className="modal-header">
          <h2>{transactionToEdit ? "Edit Transaction" : "Add Transaction"}</h2>

          <button onClick={closeModal}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type */}
          <div className="form-group">
            <label>Type</label>

            <select value={type} onChange={handleTypeChange}>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Amount + Date */}
          <div className="form-row">
            <div className="form-group">
              <label>Amount</label>

              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayString}
                required
              />
            </div>
          </div>

          {/* Note */}
          <div className="form-group">
            <label>Note (Optional)</label>

            <textarea
              rows="2"
              placeholder="Write note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button type="submit" className="save-btn">
            {transactionToEdit ? "Save Changes" : "Save Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;
