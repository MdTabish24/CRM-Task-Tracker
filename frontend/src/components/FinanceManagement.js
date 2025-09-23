import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const FinanceManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [showEarnModal, setShowEarnModal] = useState(false);
  const [spendForm, setSpendForm] = useState({ amount: '', description: '' });
  const [earnForm, setEarnForm] = useState({ amount: '', description: '' });
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/admin/transactions');
      setTransactions(response.data.transactions);
      setTotalEarned(response.data.total_earned);
      setTotalSpent(response.data.total_spent);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const addSpendTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/transactions', {
        type: 'spend',
        amount: spendForm.amount,
        description: spendForm.description
      });
      setShowSpendModal(false);
      setSpendForm({ amount: '', description: '' });
      fetchTransactions();
    } catch (error) {
      console.error('Error adding spend transaction:', error);
    }
  };

  const addEarnTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/transactions', {
        type: 'earn',
        amount: earnForm.amount,
        description: earnForm.description
      });
      setShowEarnModal(false);
      setEarnForm({ amount: '', description: '' });
      fetchTransactions();
    } catch (error) {
      console.error('Error adding earn transaction:', error);
    }
  };

  const profit = totalEarned - totalSpent;
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="finance-management">
      <div className="finance-header">
        <h2>💰 Finance Management</h2>
        <div className="month-profit">
          <div className="month-name">{currentMonth}</div>
          <div className={`profit-amount ${profit >= 0 ? 'profit' : 'loss'}`}>
            {profit >= 0 ? '+' : ''}₹{profit}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={() => setShowSpendModal(true)} className="btn spend-btn">
          📤 Spent
        </button>
        <button onClick={() => setShowEarnModal(true)} className="btn earn-btn">
          📥 Earned
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card earned">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-amount">₹{totalEarned}</div>
            <div className="card-label">Total Earned</div>
          </div>
        </div>
        <div className="summary-card spent">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <div className="card-amount">₹{totalSpent}</div>
            <div className="card-label">Total Spent</div>
          </div>
        </div>
      </div>

      <div className="transactions-list">
        <h3>Recent Transactions</h3>
        {transactions.map((transaction) => (
          <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
            <div className="transaction-info">
              <div className="transaction-desc">{transaction.description}</div>
              <div className="transaction-date">
                {new Date(transaction.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className={`transaction-amount ${transaction.type}`}>
              {transaction.type === 'earn' ? '+' : '-'}₹{transaction.amount}
            </div>
          </div>
        ))}
      </div>

      {/* Spend Modal */}
      {showSpendModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📤 Add Expense</h3>
            <form onSubmit={addSpendTransaction}>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  value={spendForm.amount}
                  onChange={(e) => setSpendForm({...spendForm, amount: e.target.value})}
                  placeholder="Enter amount..."
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Where spent?</label>
                <input
                  type="text"
                  value={spendForm.description}
                  onChange={(e) => setSpendForm({...spendForm, description: e.target.value})}
                  placeholder="e.g., Office supplies, Marketing..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowSpendModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Earn Modal */}
      {showEarnModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📥 Add Income</h3>
            <form onSubmit={addEarnTransaction}>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  value={earnForm.amount}
                  onChange={(e) => setEarnForm({...earnForm, amount: e.target.value})}
                  placeholder="Enter amount..."
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Source of income?</label>
                <input
                  type="text"
                  value={earnForm.description}
                  onChange={(e) => setEarnForm({...earnForm, description: e.target.value})}
                  placeholder="e.g., Course fees, Consultation..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEarnModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .finance-management {
          padding: 2rem;
        }

        .finance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .month-profit {
          text-align: right;
        }

        .month-name {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }

        .profit-amount {
          font-size: 2rem;
          font-weight: bold;
        }

        .profit-amount.profit {
          color: #4caf50;
        }

        .profit-amount.loss {
          color: #f44336;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .spend-btn {
          background: #f44336;
          color: white;
        }

        .earn-btn {
          background: #4caf50;
          color: white;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .summary-card.earned {
          background: #e8f5e8;
          border-left: 4px solid #4caf50;
        }

        .summary-card.spent {
          background: #ffeaea;
          border-left: 4px solid #f44336;
        }

        .card-icon {
          font-size: 2rem;
        }

        .card-amount {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .card-label {
          color: #666;
          font-size: 0.9rem;
        }

        .transactions-list {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e1e5e9;
        }

        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #f1f3f4;
          margin-bottom: 0.5rem;
        }

        .transaction-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .transaction-desc {
          font-weight: 500;
        }

        .transaction-date {
          font-size: 0.8rem;
          color: #666;
        }

        .transaction-amount.earn {
          color: #4caf50;
          font-weight: bold;
        }

        .transaction-amount.spend {
          color: #f44336;
          font-weight: bold;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 400px;
          max-width: 90vw;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default FinanceManagement;