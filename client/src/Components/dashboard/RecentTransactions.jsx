import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RecentTransactions.css";
import { API_URL } from "../../api";

function RecentTransactions({refresh}) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
  const token = localStorage.getItem("token");

  axios
    .get(`${API_URL}/api/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      setTransactions(response.data);
    })
    .catch((error) => {
      console.log(error);
    });
}, [refresh]);

  const navigate = useNavigate();

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (

    <div className="recent-transactions">
      <h3>Recent Transactions</h3>

      {recentTransactions.length === 0 ? (
        <p className="no-recent-transactions">No transactions yet</p>
      ) : (
        recentTransactions.map((transaction) => (
          <div className="transaction-item" key={transaction._id}>
            <div>
              <h4>{transaction.category}</h4>
              <h5>{new Date(transaction.date).toLocaleDateString("en-GB")}</h5>
            </div>

            <span className={transaction.type === "Income" ? "income" : ""}>
              {transaction.type === "Income" ? "+ " : "- "}₹{transaction.amount}
            </span>
          </div>
        ))
      )}

      <div className="recent-header">
    <h3>Recent Transactions</h3>

    <button onClick={() => navigate("/transactions")}>View All →</button>
  </div>
    </div>
  );
}

export default RecentTransactions;