import { useState } from "react";
import "./AddTransaction.css";
import TransactionForm from "./TransactionForm";

function AddTransaction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="add-transaction-btn"
        onClick={() => setOpen(true)}
      >
        + Add Transaction
      </button>

      {open && (
        <TransactionForm
          closeModal={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default AddTransaction;