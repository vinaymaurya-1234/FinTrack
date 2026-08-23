import { useEffect, useState } from "react";
import axios from "axios";
import "./Goals.css";

function Goals() {
  const [goals, setGoals] = useState([]);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);

  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // GET GOALS
  // =========================

  const getGoals = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/goals",
        config,
      );

      setGoals(response.data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  useEffect(() => {
    getGoals();
  }, []);

  // =========================
  // ADD GOAL
  // =========================

  const handleAddGoalClick = () => {
    setEditingGoal(null);
    setGoalName("");
    setTargetAmount("");
    setShowGoalModal(true);
  };

  // =========================
  // EDIT GOAL
  // =========================

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(goal.targetAmount);
    setShowGoalModal(true);
  };

  // =========================
  // SAVE GOAL
  // =========================

  const handleSaveGoal = async () => {
    if (!goalName.trim() || !targetAmount) {
      return;
    }

    try {
      if (editingGoal) {
        const response = await axios.put(
          `http://localhost:5000/api/goals/${editingGoal._id}`,
          {
            name: goalName,
            targetAmount: Number(targetAmount),
          },
          config,
        );

        setGoals((prev) =>
          prev.map((goal) =>
            goal._id === editingGoal._id ? response.data : goal,
          ),
        );
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/goals",
          {
            name: goalName,
            targetAmount: Number(targetAmount),
          },
          config,
        );

        setGoals((prev) => [response.data, ...prev]);
      }

      closeGoalModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save goal");
    }
  };

  // =========================
  // DELETE GOAL
  // =========================

  const handleDeleteGoal = async (goal) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${goal.name}"?`,
    );

    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/goals/${goal._id}`, config);

      setGoals((prev) => prev.filter((item) => item._id !== goal._id));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete goal");
    }
  };

  // =========================
  // ADD MONEY
  // =========================

  const handleAddMoneyClick = (goal) => {
    setSelectedGoal(goal);
    setMoneyAmount("");
    setShowMoneyModal(true);
  };

  const handleAddMoney = async () => {
    if (!selectedGoal || !moneyAmount) {
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/goals/${selectedGoal._id}/add-money`,
        {
          amount: Number(moneyAmount),
        },
        config,
      );

      setGoals((prev) =>
        prev.map((goal) =>
          goal._id === selectedGoal._id ? response.data : goal,
        ),
      );

      closeMoneyModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add money");
    }
  };

  // =========================
  // CLOSE MODALS
  // =========================

  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingGoal(null);
    setGoalName("");
    setTargetAmount("");
  };

  const closeMoneyModal = () => {
    setShowMoneyModal(false);
    setSelectedGoal(null);
    setMoneyAmount("");
  };

  // =========================
  // OVERVIEW
  // =========================

  const totalTarget = goals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  );

  const totalSaved = goals.reduce((total, goal) => total + goal.savedAmount, 0);

  const completedGoals = goals.filter(
    (goal) => goal.savedAmount >= goal.targetAmount,
  ).length;

  return (
    <div className="goals-page">
      {/* HEADER */}

      <div className="goals-header">
        <div>
          <h1>Goals</h1>

          <p>Set savings targets and track your progress.</p>
        </div>

        <button className="add-goal-btn" onClick={handleAddGoalClick}>
          + Add Goal
        </button>
      </div>

      {/* OVERVIEW */}

      {goals.length > 0 && (
        <div className="goals-overview">
          <div className="overview-item">
            <span>Total Goals</span>
            <strong>{goals.length}</strong>
          </div>

          <div className="overview-item">
            <span>Total Saved</span>

            <strong>₹{totalSaved.toLocaleString("en-IN")}</strong>
          </div>

          <div className="overview-item">
            <span>Total Target</span>

            <strong>₹{totalTarget.toLocaleString("en-IN")}</strong>
          </div>

          <div className="overview-item">
            <span>Completed</span>

            <strong>{completedGoals}</strong>
          </div>
        </div>
      )}

      {/* GOALS */}

      <div className="goals-section">
        <div className="goals-section-header">
          <div>
            <h2>Your Goals</h2>

            <p>Keep track of the things you're saving for.</p>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="goals-empty">
            <div className="empty-goal-icon">◎</div>

            <h3>No goals created yet</h3>

            <p>Create a savings goal and start working towards it.</p>

            <button className="empty-create-btn" onClick={handleAddGoalClick}>
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => {
              const percentage = Math.min(
                (goal.savedAmount / goal.targetAmount) * 100,
                100,
              );

              const remaining = Math.max(
                goal.targetAmount - goal.savedAmount,
                0,
              );

              const completed = goal.savedAmount >= goal.targetAmount;

              return (
                <div className="goal-card" key={goal._id}>
                  {/* CARD HEADER */}

                  <div className="goal-card-header">
                    <div>
                      <h3>{goal.name}</h3>

                      <span>
                        Target ₹{goal.targetAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="goal-actions">
                      <button onClick={() => handleEditGoal(goal)}>Edit</button>

                      <button
                        className="goal-delete-btn"
                        onClick={() => handleDeleteGoal(goal)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* AMOUNT */}

                  <div className="goal-amount-row">
                    <div>
                      <span>Saved</span>

                      <strong>
                        ₹{goal.savedAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <strong className="goal-percentage">
                      {Math.round(percentage)}%
                    </strong>
                  </div>

                  {/* PROGRESS */}

                  <div className="goal-progress">
                    <div
                      className="goal-progress-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  {/* FOOTER */}

                  <div className="goal-card-footer">
                    {completed ? (
                      <span className="goal-completed">✓ Goal completed</span>
                    ) : (
                      <span className="goal-remaining">
                        ₹{remaining.toLocaleString("en-IN")} remaining
                      </span>
                    )}

                    {!completed && (
                      <button
                        className="add-money-btn"
                        onClick={() => handleAddMoneyClick(goal)}
                      >
                        + Add Money
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT GOAL MODAL */}

      {showGoalModal && (
        <div className="goal-modal-overlay">
          <div className="goal-modal">
            <div className="goal-modal-header">
              <div>
                <h2>{editingGoal ? "Edit Goal" : "Create Goal"}</h2>

                <p>
                  {editingGoal
                    ? "Update your goal details."
                    : "Set a target for something you want to achieve."}
                </p>
              </div>

              <button className="goal-modal-close" onClick={closeGoalModal}>
                ×
              </button>
            </div>

            <div className="goal-form">
              <div className="goal-form-group">
                <label>Goal Name</label>

                <input
                  type="text"
                  placeholder="e.g. New Laptop"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>

              <div className="goal-form-group">
                <label>Target Amount</label>

                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="goal-modal-actions">
              <button className="goal-cancel-btn" onClick={closeGoalModal}>
                Cancel
              </button>

              <button className="goal-save-btn" onClick={handleSaveGoal}>
                {editingGoal ? "Save Changes" : "Create Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MONEY MODAL */}

      {showMoneyModal && selectedGoal && (
        <div className="goal-modal-overlay">
          <div className="goal-modal money-modal">
            <div className="goal-modal-header">
              <div>
                <h2>Add Money</h2>

                <p>
                  Add money towards <strong>{selectedGoal.name}</strong>.
                </p>
              </div>

              <button className="goal-modal-close" onClick={closeMoneyModal}>
                ×
              </button>
            </div>

            <div className="money-summary">
              <div>
                <span>Currently Saved</span>

                <strong>
                  ₹{selectedGoal.savedAmount.toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <span>Remaining</span>

                <strong>
                  ₹
                  {(
                    selectedGoal.targetAmount - selectedGoal.savedAmount
                  ).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="goal-form-group">
              <label>Amount to Add</label>

              <input
                type="number"
                min="1"
                placeholder="e.g. 5000"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(e.target.value)}
              />
            </div>

            <div className="goal-modal-actions">
              <button className="goal-cancel-btn" onClick={closeMoneyModal}>
                Cancel
              </button>

              <button className="goal-save-btn" onClick={handleAddMoney}>
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Goals;
