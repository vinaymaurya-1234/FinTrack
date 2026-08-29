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

  // Fetch selected month data
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [categoryResponse, transactionResponse] = await Promise.all([
        fetch(
          `${API_URL}/api/budget-categories?month=${selectedMonth}&year=${selectedYear}`,
          { headers },
        ),
        fetch(`${API_URL}/api/transactions`, {
          headers,
        }),
      ]);

      const categoryData = await categoryResponse.json();
      const transactionData = await transactionResponse.json();

      if (categoryResponse.ok) {
        setBudgetCategories(categoryData);
      } else {
        setBudgetCategories([]);
      }

      if (transactionResponse.ok) {
        setTransactions(transactionData);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching budget plan:", error);

      setBudgetCategories([]);
      setTransactions([]);
    }
  };

  // Selected month/year change hone par data fetch hoga
  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // IMPORTANT:
  // Parent se aaye selected month/year ke according transactions filter karo
  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === selectedMonthIndex &&
      transactionDate.getFullYear() === selectedYear
    );
  });

  const getCategorySpent = (category) => {
    return selectedMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          transaction.category.toLowerCase() === category.toLowerCase(),
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  };

  const getCategoryIcon = (category) => {
    const name = category.toLowerCase();

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

  const addBudgetCategory = async () => {
    if (!categoryName || !categoryAmount) {
      alert("Please enter category name and amount");
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
          category: categoryName,
          amount: Number(categoryAmount),

          // IMPORTANT:
          // Selected month/year me category save hogi
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCategoryModal(false);
        setCategoryName("");
        setCategoryAmount("");

        fetchData();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/budget-categories/${categoryId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <>
      <div className="budget-plan">
        <div className="section-header">
          <h3>Your Budget Plan</h3>

          <button onClick={() => setShowManageCategories(true)}>
            Manage Categories
          </button>
        </div>

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

        <button
          className="add-category-btn"
          onClick={() => setShowCategoryModal(true)}
        >
          + Add Category
        </button>
      </div>

      {/* ADD CATEGORY MODAL */}

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

      {/* MANAGE CATEGORY MODAL */}

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
