import { useEffect, useState } from "react";
import BudgetRow from "./BudgetRow";
import "./BudgetPlan.css";
import { API_URL } from "../../api";

function BudgetPlan({ selectedMonth, selectedYear, selectedMonthIndex }) {
  const [budgetCategories, setBudgetCategories] = useState([]);

  const [transactions, setTransactions] = useState([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showManageCategories, setShowManageCategories] = useState(false);

  const [categoryName, setCategoryName] = useState("");

  const [categoryAmount, setCategoryAmount] = useState("");

  // ======================================================
  // FETCH DATA
  // ======================================================

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [categoryResponse, transactionResponse] = await Promise.all([
        fetch(
          `${API_URL}/api/budget-categories?month=${encodeURIComponent(
            selectedMonth,
          )}&year=${selectedYear}`,
          {
            headers,
          },
        ),

        fetch(`${API_URL}/api/transactions`, {
          headers,
        }),
      ]);

      // ------------------------------------------
      // CATEGORY DATA
      // ------------------------------------------

      const categoryData = await categoryResponse.json();

      if (categoryResponse.ok) {
        setBudgetCategories(Array.isArray(categoryData) ? categoryData : []);
      } else {
        setBudgetCategories([]);
      }

      // ------------------------------------------
      // TRANSACTION DATA
      // ------------------------------------------

      const transactionData = await transactionResponse.json();

      if (transactionResponse.ok) {
        setTransactions(Array.isArray(transactionData) ? transactionData : []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching budget plan:", error);

      setBudgetCategories([]);
      setTransactions([]);
    }
  };

  // ======================================================
  // NORMAL FETCH
  // ======================================================

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // ======================================================
  // VOICE CATEGORY UPDATE
  // ======================================================

  useEffect(() => {
    const handleCategoryUpdated = () => {
      console.log("🔄 Budget category updated - refreshing...");

      fetchData();
    };

    window.addEventListener("categoryUpdated", handleCategoryUpdated);

    return () => {
      window.removeEventListener("categoryUpdated", handleCategoryUpdated);
    };
  }, [selectedMonth, selectedYear]);

  // ======================================================
  // FILTER TRANSACTIONS BY SELECTED MONTH
  // ======================================================

  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === selectedMonthIndex &&
      transactionDate.getFullYear() === Number(selectedYear)
    );
  });

  // ======================================================
  // CATEGORY SPENT
  // ======================================================

  const getCategorySpent = (category) => {
    return selectedMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          String(transaction.category).toLowerCase() ===
            String(category).toLowerCase(),
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  };

  // ======================================================
  // CATEGORY ICON
  // ======================================================

  const getCategoryIcon = (category) => {
    const name = String(category).toLowerCase();

    if (name.includes("food")) return "🍔";

    if (name.includes("grocery")) return "🛒";

    if (name.includes("rent")) return "🏠";

    if (name.includes("travel")) return "✈️";

    if (name.includes("transport")) return "🚕";

    if (name.includes("medical") || name.includes("medicine")) return "💊";

    if (name.includes("bill") || name.includes("utility")) return "💡";

    if (name.includes("shopping")) return "🛍️";

    if (name.includes("fitness") || name.includes("gym")) return "🏋️";

    if (name.includes("entertainment")) return "🎬";

    if (name.includes("education")) return "📚";

    if (name.includes("other")) return "📦";

    return "📌";
  };

  // ======================================================
  // ADD CATEGORY MANUALLY
  // ======================================================

  const addBudgetCategory = async () => {
    const cleanCategory = categoryName.trim();

    const numericAmount = Number(categoryAmount);

    if (!cleanCategory || !categoryAmount) {
      alert("Please enter category name and amount");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Category budget must be greater than 0");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        return;
      }

      const response = await fetch(`${API_URL}/api/budget-categories`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          category: cleanCategory,

          amount: numericAmount,

          month: selectedMonth,

          year: Number(selectedYear),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCategoryModal(false);

        setCategoryName("");
        setCategoryAmount("");

        await fetchData();
      } else {
        alert(data.message || "Unable to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);

      alert("Something went wrong while adding category.");
    }
  };

  // ======================================================
  // DELETE CATEGORY
  // ======================================================

  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/budget-categories/${categoryId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        await fetchData();
      } else {
        alert(data.message || "Unable to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);

      alert("Something went wrong while deleting category.");
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <div className="budget-plan">
        {/* HEADER */}

        <div className="section-header">
          <h3>Your Budget Plan</h3>

          <button onClick={() => setShowManageCategories(true)}>
            Manage Categories
          </button>
        </div>

        {/* TABLE */}

        <div className="budget-table">
          <div className="budget-table-header">
            <span>Category</span>

            <span>Budget</span>

            <span>Spent</span>

            <span>Remaining</span>

            <span>Progress</span>

            <span></span>
          </div>

          {budgetCategories.length > 0 ? (
            budgetCategories.map((category) => {
              const spent = getCategorySpent(category.category);

              const categoryBudget = Number(category.amount);

              const actualProgress =
                categoryBudget > 0 ? (spent / categoryBudget) * 100 : 0;

              const remaining = categoryBudget - spent;

              return (
                <BudgetRow
                  key={category._id}
                  icon={getCategoryIcon(category.category)}
                  category={category.category}
                  budget={categoryBudget}
                  spent={spent}
                  remaining={remaining}
                  progress={actualProgress}
                />
              );
            })
          ) : (
            <p
              style={{
                padding: "20px",
                textAlign: "center",
              }}
            >
              No budget categories added for {selectedMonth} {selectedYear}.
            </p>
          )}
        </div>

        {/* ADD CATEGORY BUTTON */}

        <button
          className="add-category-btn"
          onClick={() => setShowCategoryModal(true)}
        >
          + Add Category
        </button>
      </div>

      {/* ==================================================
          ADD CATEGORY MODAL
      ================================================== */}

      {showCategoryModal && (
        <div className="budget-modal-overlay">
          <div className="budget-modal">
            <h2>Add Budget Category</h2>

            <p>
              Allocate a part of your budget for {selectedMonth} {selectedYear}.
            </p>

            <input
              type="text"
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Enter category budget"
              value={categoryAmount}
              onChange={(e) => setCategoryAmount(e.target.value)}
            />

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowCategoryModal(false);

                  setCategoryName("");

                  setCategoryAmount("");
                }}
              >
                Cancel
              </button>

              <button className="save-budget-btn" onClick={addBudgetCategory}>
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MANAGE CATEGORY MODAL
      ================================================== */}

      {showManageCategories && (
        <div className="modal-overlay">
          <div className="manage-category-modal">
            <div className="manage-category-header">
              <div>
                <h3>Manage Categories</h3>

                <p>
                  {selectedMonth} {selectedYear}
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowManageCategories(false)}
              >
                ×
              </button>
            </div>

            <div className="manage-category-list">
              {budgetCategories.length === 0 ? (
                <p className="no-categories">
                  No categories added for this month.
                </p>
              ) : (
                budgetCategories.map((item) => (
                  <div className="manage-category-item" key={item._id}>
                    <div>
                      <h4>{item.category}</h4>

                      <p>₹{Number(item.amount).toLocaleString("en-IN")}</p>
                    </div>

                    <button
                      className="delete-category-btn"
                      onClick={() => handleDeleteCategory(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BudgetPlan;
