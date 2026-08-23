import "./BudgetRow.css";

function BudgetRow({
  icon,
  category,
  budget,
  spent,
  remaining,
  progress,
}) {
  const progressWidth = Math.min(progress, 100);

  return (
    <div className="budget-row">
      <div className="category-info">
        <div className="category-icon">{icon}</div>

        <div>
          <h4>{category}</h4>
        </div>
      </div>

      <span>₹{Number(budget).toLocaleString()}</span>
      <span>₹{Number(spent).toLocaleString()}</span>
      <span>₹{Number(remaining).toLocaleString()}</span>

      <div className="progress-column">
        <span>{progress.toFixed(0)}%</span>

        <div className="small-progress">
          <div
            style={{
              width: `${progressWidth}%`,
            }}
          ></div>
        </div>
      </div>

      <button className="row-menu">⋮</button>
    </div>
  );
}

export default BudgetRow;