import { useEffect, useState } from "react";
import "./BudgetInsights.css";

function BudgetInsights() {
  const [budget, setBudget] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);

  const currentDate = new Date();

  const selectedMonth = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  const selectedYear = currentDate.getFullYear();

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
              `http://localhost:5000/api/budgets?month=${selectedMonth}&year=${selectedYear}`,
              { headers }
            ),
            fetch("http://localhost:5000/api/transactions", {
              headers,
            }),
            fetch(
              `http://localhost:5000/api/budget-categories?month=${selectedMonth}&year=${selectedYear}`,
              { headers }
            ),
          ]);

        const budgetData = await budgetResponse.json();
        const transactionData = await transactionResponse.json();
        const categoryData = await categoryResponse.json();

        if (budgetResponse.ok) {
          setBudget(budgetData.budget || budgetData);
        }

        if (transactionResponse.ok) {
          setTransactions(transactionData);
        }

        if (categoryResponse.ok) {
          setBudgetCategories(categoryData);
        }
      } catch (error) {
        console.error("Error fetching insights data:", error);
      }
    };

    fetchInsightsData();
  }, [selectedMonth, selectedYear]);

  const selectedMonthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);

    return (
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const totalSpent = selectedMonthTransactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );

  const totalBudget = budget ? Number(budget.amount) : 0;

  const totalRemaining = totalBudget - totalSpent;

  const usedPercentage =
    totalBudget > 0
      ? (totalSpent / totalBudget) * 100
      : 0;

  const getCategorySpent = (category) => {
    return selectedMonthTransactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          transaction.category.toLowerCase() ===
            category.toLowerCase()
      )
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );
  };

  const categoryInsights = budgetCategories.map((category) => {
    const spent = getCategorySpent(category.category);
    const categoryBudget = Number(category.amount);

    const progress =
      categoryBudget > 0
        ? (spent / categoryBudget) * 100
        : 0;

    return {
      category: category.category,
      spent,
      progress,
    };
  });

  const exceededCategories = categoryInsights.filter(
    (category) => category.progress > 100
  );

  const highestExceededCategory = [...exceededCategories].sort(
    (a, b) => b.progress - a.progress
  )[0];

  const highestSpentCategory = [...categoryInsights].sort(
    (a, b) => b.spent - a.spent
  )[0];

  return (
    <div className="budget-insights">
      <h3>Budget Insights</h3>

      <div className="insight-list">
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
                    totalRemaining
                  ).toLocaleString("en-IN")}.`
                : `You've used ${usedPercentage.toFixed(
                    0
                  )}% of your monthly budget.`}
            </p>
          </div>
        </div>

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
                    0
                  )}% of its budget.`
                : "All your category spending is currently within budget."}
            </p>
          </div>
        </div>

        <div className="insight">
          <div className="insight-icon info">i</div>

          <div>
            <h4>Tip for you</h4>

            <p>
              {highestSpentCategory
                ? `Your highest spending category is ${
                    highestSpentCategory.category
                  } with ₹${highestSpentCategory.spent.toLocaleString(
                    "en-IN"
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