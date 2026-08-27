import { useEffect, useState } from "react";
import axios from "axios";
import { FaEllipsisV, FaBullseye } from "react-icons/fa";
import "./Goals.css";

function Goals() {
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [moneyModal, setMoneyModal] = useState(null);
  const [releaseModal, setReleaseModal] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");

  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchGoals = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/goals",
        config,
      );
      setGoals(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to load goals");
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const createGoal = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5000/api/goals",
        {
          name: goalName,
          targetAmount: Number(targetAmount),
        },
        config,
      );

      setGoalName("");
      setTargetAmount("");
      setShowGoalModal(false);
      fetchGoals();
      showToast("Goal created successfully");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to create goal");
    }
  };

  const updateGoal = async (goal) => {
    try {
      await axios.put(
        `http://localhost:5000/api/goals/${goal._id}`,
        {
          name: goal.name,
          targetAmount: Number(goal.targetAmount),
        },
        config,
      );

      setEditingId(null);
      fetchGoals();
      showToast("Goal updated successfully");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update goal");
    }
  };

  const deleteGoal = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/goals/${id}`, config);

      setMenuId(null);
      fetchGoals();
      showToast("Goal deleted successfully");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete goal");
    }
  };

  const addMoney = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:5000/api/goals/${moneyModal._id}/add-money`,
        { amount: Number(moneyAmount) },
        config,
      );

      setMoneyAmount("");
      setMoneyModal(null);
      fetchGoals();
      showToast("Money added successfully");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to add money");
    }
  };

  const releaseMoney = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:5000/api/goals/${releaseModal._id}/release-money`,
        { amount: Number(moneyAmount) },
        config,
      );

      setMoneyAmount("");
      setReleaseModal(null);
      fetchGoals();
      showToast("Money released successfully");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to release money");
    }
  };

  const totalSaved = goals.reduce(
    (sum, goal) => sum + Number(goal.savedAmount),
    0,
  );

  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.targetAmount),
    0,
  );

  const completed = goals.filter(
    (goal) => Number(goal.savedAmount) >= Number(goal.targetAmount),
  ).length;

  return (
    <div className="goals-page">
      <div className="goals-header">
        <div>
          <h1>Goals</h1>
          <p>Set savings targets and track your progress.</p>
        </div>

        <button className="add-goal-btn" onClick={() => setShowGoalModal(true)}>
          + Add Goal
        </button>
      </div>

      <div className="goals-overview">
        <div className="overview-item">
          <span>Total Goals</span>
          <strong>{goals.length}</strong>
        </div>

        <div className="overview-item">
          <span>Total Reserved</span>
          <strong>₹{totalSaved.toLocaleString("en-IN")}</strong>
        </div>

        <div className="overview-item">
          <span>Total Target</span>
          <strong>₹{totalTarget.toLocaleString("en-IN")}</strong>
        </div>

        <div className="overview-item">
          <span>Completed</span>
          <strong>{completed}</strong>
        </div>
      </div>

      <div className="goals-section">
        <div className="goals-section-header">
          <h2>Your Goals</h2>
          <p>Keep track of the things you're saving for.</p>
        </div>

        {goals.length === 0 ? (
          <div className="goals-empty">
            <div className="empty-goal-icon">
              <FaBullseye />
            </div>

            <h3>No goals yet</h3>
            <p>
              Create your first savings goal to start tracking your progress.
            </p>

            <button
              className="empty-create-btn"
              onClick={() => setShowGoalModal(true)}
            >
              + Create Goal
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => {
              const percentage = Math.min(
                100,
                Math.round((goal.savedAmount / goal.targetAmount) * 100),
              );

              const remaining = goal.targetAmount - goal.savedAmount;

              return (
                <div className="goal-card" key={goal._id}>
                  <div className="goal-card-header">
                    {editingId === goal._id ? (
                      <div className="goal-inline-edit">
                        <input
                          className="goal-edit-input"
                          value={goal.name}
                          onChange={(e) =>
                            setGoals((prev) =>
                              prev.map((item) =>
                                item._id === goal._id
                                  ? { ...item, name: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />

                        <input
                          className="goal-edit-input"
                          type="number"
                          value={goal.targetAmount}
                          onChange={(e) =>
                            setGoals((prev) =>
                              prev.map((item) =>
                                item._id === goal._id
                                  ? {
                                      ...item,
                                      targetAmount: e.target.value,
                                    }
                                  : item,
                              ),
                            )
                          }
                        />

                        <div className="goal-edit-actions">
                          <button
                            className="goal-cancel-edit-btn"
                            onClick={() => {
                              setEditingId(null);
                              fetchGoals();
                            }}
                          >
                            Cancel
                          </button>

                          <button
                            className="goal-save-edit-btn"
                            onClick={() => updateGoal(goal)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3>{goal.name}</h3>
                        <span>
                          Target ₹
                          {Number(goal.targetAmount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <div className="goal-menu">
                      <button
                        className="goal-menu-btn"
                        onClick={() =>
                          setMenuId(menuId === goal._id ? null : goal._id)
                        }
                      >
                        <FaEllipsisV />
                      </button>

                      {menuId === goal._id && (
                        <div className="goal-menu-dropdown">
                          <button
                            onClick={() => {
                              setEditingId(goal._id);
                              setMenuId(null);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-option"
                            onClick={() => deleteGoal(goal._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="goal-amount-row">
                    <div>
                      <span>Locked</span>
                      <strong>
                        ₹{Number(goal.savedAmount).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <strong className="goal-percentage">{percentage}%</strong>
                  </div>

                  <div className="goal-progress">
                    <div
                      className="goal-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="goal-card-footer">
                    {remaining > 0 ? (
                      <span className="goal-remaining">
                        ₹{remaining.toLocaleString("en-IN")} remaining
                      </span>
                    ) : (
                      <span className="goal-completed">Goal completed</span>
                    )}

                    <div className="goal-money-actions">
                      {remaining > 0 && (
                        <button
                          className="add-money-btn"
                          onClick={() => {
                            setMoneyAmount("");
                            setMoneyModal(goal);
                          }}
                        >
                          + Add Money
                        </button>
                      )}

                      {Number(goal.savedAmount) > 0 && (
                        <button
                          className="release-money-btn"
                          onClick={() => {
                            setMoneyAmount("");
                            setReleaseModal(goal);
                          }}
                        >
                          Release
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showGoalModal && (
        <div className="goal-modal-overlay">
          <div className="goal-modal">
            <div className="goal-modal-header">
              <div>
                <h2>Add Goal</h2>
                <p>Create a new savings goal.</p>
              </div>

              <button
                className="goal-modal-close"
                onClick={() => setShowGoalModal(false)}
              >
                ×
              </button>
            </div>

            <form className="goal-form" onSubmit={createGoal}>
              <div className="goal-form-group">
                <label>Goal Name</label>
                <input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Laptop"
                  required
                />
              </div>

              <div className="goal-form-group">
                <label>Target Amount</label>
                <input
                  type="number"
                  min="1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="50000"
                  required
                />
              </div>

              <div className="goal-modal-actions">
                <button
                  type="button"
                  className="goal-cancel-btn"
                  onClick={() => setShowGoalModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="goal-save-btn">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {moneyModal && (
        <div className="goal-modal-overlay">
          <div className="goal-modal money-modal">
            <div className="goal-modal-header">
              <div>
                <h2>Add Money</h2>
                <p>Add money to {moneyModal.name}.</p>
              </div>

              <button
                className="goal-modal-close"
                onClick={() => setMoneyModal(null)}
              >
                ×
              </button>
            </div>

            <form className="goal-form" onSubmit={addMoney}>
              <div className="money-summary">
                <div>
                  <span>Locked Amount</span>
                  <strong>
                    ₹{Number(moneyModal.savedAmount).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>
                    ₹
                    {(
                      moneyModal.targetAmount - moneyModal.savedAmount
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="goal-form-group">
                <label>Amount</label>
                <input
                  type="number"
                  min="1"
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                  required
                />
              </div>

              <div className="goal-modal-actions">
                <button
                  type="button"
                  className="goal-cancel-btn"
                  onClick={() => setMoneyModal(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="goal-save-btn">
                  Add Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {releaseModal && (
        <div className="goal-modal-overlay">
          <div className="goal-modal money-modal">
            <div className="goal-modal-header">
              <div>
                <h2>Release Money</h2>
                <p>Release money from {releaseModal.name}.</p>
              </div>

              <button
                className="goal-modal-close"
                onClick={() => setReleaseModal(null)}
              >
                ×
              </button>
            </div>

            <form className="goal-form" onSubmit={releaseMoney}>
              <div className="money-summary">
                <div>
                  <span>Locked Amount</span>
                  <strong>
                    ₹{Number(releaseModal.savedAmount).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>After Release</span>
                  <strong>
                    ₹
                    {(
                      releaseModal.savedAmount - Number(moneyAmount || 0)
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="goal-form-group">
                <label>Amount to Release</label>
                <input
                  type="number"
                  min="1"
                  max={releaseModal.savedAmount}
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                  required
                />
              </div>

              <div className="goal-modal-actions">
                <button
                  type="button"
                  className="goal-cancel-btn"
                  onClick={() => setReleaseModal(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="goal-save-btn">
                  Release Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="goal-toast">{toast}</div>}
    </div>
  );
}

export default Goals;
