import "./SpendingItem.css";

function SpendingItem({ icon, name, category, amount, date }) {
  return (
    <div className="spending-item">
      <div className="spending-left">
        <div className="spending-icon">{icon}</div>

        <div>
          <h4>{name}</h4>

          <p>
            {category} • {date}
          </p>
        </div>
      </div>

      <strong>{amount}</strong>
    </div>
  );
}

export default SpendingItem;