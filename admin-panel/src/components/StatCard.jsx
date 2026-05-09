
const StatCard = ({ title, value, subValue }) => (
  <div className="card card-body stat-card-main">
    <h3 className="stat-title-sm">{title}</h3>
    <p className="stat-value-lg">{value}</p>
    {subValue && <p className="text-sm muted">{subValue}</p>}
  </div>
);

export default StatCard;
