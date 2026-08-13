import { useState } from "react";
import "./AddTransaction.css";
import TransactionForm from "./TransactionForm";

function AddTransaction({
  onSave,
  transactionToEdit,
  onUpdate,
  clearEdit,
}) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);

    if (clearEdit) {
      clearEdit();
    }
  };

  const handleFormSave = (transaction) => {
    if (transactionToEdit) {
      onUpdate(transaction);
    } else {
      onSave(transaction);
    }

    handleClose();
  };

  return (
    <>
      <button
        className="add-transaction-btn"
        onClick={() => setOpen(true)}
      >
        + Add Transaction
      </button>

      {(open || transactionToEdit) && (
        <TransactionForm
          closeModal={handleClose}
          onSave={handleFormSave}
          transactionToEdit={transactionToEdit}
        />
      )}
    </>
  );
}

export default AddTransaction;