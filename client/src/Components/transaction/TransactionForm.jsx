import "./TransactionForm.css";
import { expenseCategories, incomeCategories } from "../../utils/categories";
import { useState } from "react";

function TransactionForm({ closeModal }) {
  const [type, setType] = useState("Expense");
  return (
    <div className="modal-overlay">
      <div className="transaction-modal">
        <div className="modal-header">
          <h2>Add Transaction</h2>

          <button onClick={closeModal}>✕</button>
        </div>

        <form>
          <div className="form-group">
            <label>Type</label>

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Expense</option>
              <option>Income</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>

            <select>
              {(type === "Expense" ? expenseCategories : incomeCategories).map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Amount</label>

            <input type="number" placeholder="Enter amount" />
          </div>

          <div className="form-group">
            <label>Date</label>

            <input type="date" />
          </div>

          <div className="form-group">
            <label>Note</label>

            <textarea rows="3" placeholder="Write note..." />
          </div>

          <button className="save-btn">Save Transaction</button>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;
