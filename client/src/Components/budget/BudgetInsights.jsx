import { useEffect, useState } from "react";
import "./BudgetInsights.css";
import { API_URL } from "../../api";

function BudgetInsights({ selectedMonth, selectedYear, selectedMonthIndex }) {
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);

  useEffect(() => {
    const fetchInsightsData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [budgetResponse, transactionResponse, categoryResponse] =
          await Promise.all([
            fetch(
              `${API_URL}/api/budgets?month=${encodeURIComponent(
                selectedMonth,
              )}&year=${selectedYear}`,
              {
                headers,
              },
            ),

            fetch(`${API_URL}/api/transactions`, {
              headers,
            }),

            fetch(
              `${API_URL}/api/budget-categories?month=${encodeURIComponent(
                selectedMonth,
              )}&year=${selectedYear}`,
              {
                headers,
              },
            ),
          ]);

        const budgetData = await budgetResponse.json();
        const transactionData = await transactionResponse.json();
        const categoryData = await categoryResponse.json();

        // ================================
        // BUDGET
        // ================================

        if (budgetResponse.ok) {
          setBudget(budgetData?.budget || budgetData || null);
        } else {
          console.error("Budget insights request failed:", budgetData?.message);

          setBudget(null);
        }

        // ================================
        // TRANSACTIONS
        // ================================

        if (transactionResponse.ok) {
          setTransactions(
            Array.isArray(transactionData) ? transactionData : [],
          );
        } else {
          setTransactions([]);
        }

        // ================================
        // BUDGET CATEGORIES
        // ================================

        if (categoryResponse.ok) {
          setBudgetCategories(Array.isArray(categoryData) ? categoryData : []);
        } else {
          setBudgetCategories([]);
        }
      } catch (error) {
        console.error("Error fetching insights data:", error);

        setBudget(null);
        setTransactions([]);
        setBudgetCategories([]);
      }
    };

    fetchInsightsData();
  }, [selectedMonth, selectedYear, selectedMonthIndex]);

  // ================================
  // FILTER SELECTED MONTH
  // ================================

  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === selectedMonthIndex &&
      transactionDate.getFullYear() === Number(selectedYear)
    );
  });

  // ================================
  // TOTAL SPENT
  // ================================

  const totalSpent = selectedMonthTransactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  // ================================
  // TOTAL BUDGET
  // ================================

  const totalBudget = budget ? Number(budget.amount) || 0 : 0;

  // ================================
  // REMAINING
  // ================================

  const totalRemaining = totalBudget - totalSpent;

  // ================================
  // USED %
  // ================================

  const usedPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // ================================
  // CATEGORY SPENDING
  // ================================

  const getCategorySpent = (category) => {
    return selectedMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          String(transaction.category || "")
            .trim()
            .toLowerCase() ===
            String(category || "")
              .trim()
              .toLowerCase(),
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  };

  // ================================
  // CATEGORY INSIGHTS
  // ================================

  const categoryInsights = budgetCategories.map((category) => {
    const spent = getCategorySpent(category.category);

    const categoryBudget = Number(category.amount) || 0;

    const progress = categoryBudget > 0 ? (spent / categoryBudget) * 100 : 0;

    return {
      category: category.category,
      spent,
      progress,
    };
  });

  // ================================
  // EXCEEDED CATEGORIES
  // ================================

  const exceededCategories = categoryInsights.filter(
    (category) => category.progress > 100,
  );

  // ================================
  // HIGHEST EXCEEDED
  // ================================

  const highestExceededCategory = [...exceededCategories].sort(
    (a, b) => b.progress - a.progress,
  )[0];

  // ================================
  // HIGHEST SPENDING
  // ================================

  const highestSpentCategory = [...categoryInsights].sort(
    (a, b) => b.spent - a.spent,
  )[0];

  return (
    <div className="budget-insights">
      <h3>Budget Insights</h3>

      <div className="insight-list">
        {/* ================================
            BUDGET INSIGHT
        ================================= */}

        <div className="insight">
          <div
            className={`insight-icon ${
              usedPercentage > 100 ? "warning" : "success"
            }`}
          >
            {usedPercentage > 100 ? "!" : "↗"}
          </div>

          <div>
            <h4>
              {usedPercentage > 100
                ? "Budget exceeded!"
                : usedPercentage >= 80
                  ? "Watch out!"
                  : "You're on track!"}
            </h4>

            <p>
              {usedPercentage > 100
                ? `You've exceeded your monthly budget by ₹${Math.abs(
                    totalRemaining,
                  ).toLocaleString("en-IN")}.`
                : `You've used ${usedPercentage.toFixed(
                    0,
                  )}% of your monthly budget.`}
            </p>
          </div>
        </div>

        {/* ================================
            CATEGORY INSIGHT
        ================================= */}

        <div className="insight">
          <div className="insight-icon warning">⚠</div>

          <div>
            <h4>
              {exceededCategories.length > 0
                ? `${exceededCategories.length} ${
                    exceededCategories.length === 1
                      ? "category has"
                      : "categories have"
                  } exceeded budget`
                : "No category exceeded"}
            </h4>

            <p>
              {highestExceededCategory
                ? `${highestExceededCategory.category} is ${highestExceededCategory.progress.toFixed(
                    0,
                  )}% of its budget.`
                : "All your category spending is currently within budget."}
            </p>
          </div>
        </div>

        {/* ================================
            PERSONALIZED TIP
        ================================= */}

        <div className="insight">
          <div className="insight-icon info">i</div>

          <div>
            <h4>Tip for you</h4>

            <p>
              {highestSpentCategory && highestSpentCategory.spent > 0
                ? `Your highest spending category is ${highestSpentCategory.category} with ₹${highestSpentCategory.spent.toLocaleString(
                    "en-IN",
                  )} spent.`
                : "Add transactions to start getting personalized insights."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetInsights;
