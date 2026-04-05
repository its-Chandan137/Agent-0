import { useEffect, useState } from 'react';
import { formatCurrency } from '../lib/format';

function ProfilePage({ profile, isSaving, onSave }) {
  const [form, setForm] = useState({
    income: '',
    fixedExpenses: '',
    savingsGoal: '',
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    setForm({
      income: profile.income ?? '',
      fixedExpenses: profile.fixedExpenses ?? '',
      savingsGoal: profile.savingsGoal ?? '',
    });
  }, [profile]);

  const income = Number(form.income) || 0;
  const fixedExpenses = Number(form.fixedExpenses) || 0;
  const savingsGoal = Number(form.savingsGoal) || 0;
  const discretionary = income - fixedExpenses - savingsGoal;

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    const result = await onSave(form);
    setStatus(result.success ? 'Profile saved.' : result.message || 'Could not save your profile.');
  }

  return (
    <section className="page profile-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Profile</p>
          <h2>Your monthly budget baseline</h2>
        </div>
      </div>

      <div className="page-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <label>
            Monthly income
            <input
              type="number"
              min="0"
              value={form.income}
              onChange={(event) => setForm((current) => ({ ...current, income: event.target.value }))}
              placeholder="85000"
            />
          </label>

          <label>
            Fixed expenses
            <input
              type="number"
              min="0"
              value={form.fixedExpenses}
              onChange={(event) =>
                setForm((current) => ({ ...current, fixedExpenses: event.target.value }))
              }
              placeholder="32000"
            />
          </label>

          <label>
            Savings goal
            <input
              type="number"
              min="0"
              value={form.savingsGoal}
              onChange={(event) =>
                setForm((current) => ({ ...current, savingsGoal: event.target.value }))
              }
              placeholder="15000"
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>

          {status ? <p className="form-status">{status}</p> : null}
        </form>

        <div className="panel summary-panel">
          <h3>Budget snapshot</h3>
          <div className="summary-metric">
            <span>Income</span>
            <strong>{formatCurrency(income)}</strong>
          </div>
          <div className="summary-metric">
            <span>Expenses</span>
            <strong>{formatCurrency(fixedExpenses)}</strong>
          </div>
          <div className="summary-metric">
            <span>Savings goal</span>
            <strong>{formatCurrency(savingsGoal)}</strong>
          </div>
          <div className="summary-metric emphasis">
            <span>Discretionary amount</span>
            <strong>{formatCurrency(discretionary)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
