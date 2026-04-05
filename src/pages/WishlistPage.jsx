import { useMemo, useState } from 'react';
import { formatCurrency, formatDate } from '../lib/format';

const priorityOptions = ['High', 'Medium', 'Low'];

function WishlistPage({ wishlist, profile, isCreating, onCreate, onDelete }) {
  const [form, setForm] = useState({
    name: '',
    cost: '',
    priority: 'Medium',
  });
  const [status, setStatus] = useState('');

  const discretionary = useMemo(() => {
    const income = Number(profile.income) || 0;
    const fixedExpenses = Number(profile.fixedExpenses) || 0;
    const savingsGoal = Number(profile.savingsGoal) || 0;
    return income - fixedExpenses - savingsGoal;
  }, [profile.fixedExpenses, profile.income, profile.savingsGoal]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    const result = await onCreate(form);

    if (result.success) {
      setForm({ name: '', cost: '', priority: 'Medium' });
      setStatus('Wishlist item saved.');
    } else {
      setStatus(result.message || 'Could not add this wishlist item.');
    }
  }

  async function handleDelete(itemId) {
    const result = await onDelete(itemId);

    if (!result.success) {
      setStatus(result.message || 'Could not delete this wishlist item.');
    }
  }

  return (
    <section className="page wishlist-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Wishlist</p>
          <h2>Track what you want before you buy it</h2>
        </div>
      </div>

      <div className="page-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <label>
            Item name
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Noise-cancelling headphones"
            />
          </label>

          <label>
            Estimated cost
            <input
              type="number"
              min="0"
              value={form.cost}
              onChange={(event) => setForm((current) => ({ ...current, cost: event.target.value }))}
              placeholder="12000"
            />
          </label>

          <label>
            Priority
            <select
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({ ...current, priority: event.target.value }))
              }
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="primary-button" disabled={isCreating}>
            {isCreating ? 'Adding...' : 'Add wishlist item'}
          </button>

          {status ? <p className="form-status">{status}</p> : null}
        </form>

        <div className="panel summary-panel">
          <h3>Wishlist context</h3>
          <div className="summary-metric emphasis">
            <span>Monthly discretionary amount</span>
            <strong>{formatCurrency(discretionary)}</strong>
          </div>
          <div className="summary-metric">
            <span>Tracked items</span>
            <strong>{wishlist.length}</strong>
          </div>
        </div>
      </div>

      <div className="wishlist-list">
        {wishlist.length === 0 ? (
          <div className="empty-state compact">
            <h3>No wishlist items yet</h3>
            <p>Add future purchases here so the assistant can factor them into its advice.</p>
          </div>
        ) : (
          wishlist.map((item) => (
            <article key={item._id} className="wishlist-card">
              <div>
                <p className="wishlist-priority">{item.priority}</p>
                <h3>{item.name}</h3>
                <p className="wishlist-date">Added {formatDate(item.dateAdded)}</p>
              </div>
              <div className="wishlist-card-side">
                <strong>{formatCurrency(item.cost)}</strong>
                <button type="button" className="ghost-button" onClick={() => handleDelete(item._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default WishlistPage;
