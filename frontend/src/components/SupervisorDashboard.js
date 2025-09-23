import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const SupervisorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, transRes, admissionsRes] = await Promise.all([
        api.get('/admin/visit-stats'),
        api.get('/admin/transactions'),
        api.get('/admin/other-admissions-list')
      ]);
      
      setStats(statsRes.data);
      setTransactions(transRes.data.transactions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="supervisor-dashboard">
      <div className="dashboard-header">
        <h1>👨‍💼 Supervisor Dashboard</h1>
        <div className="month-display">{currentMonth}</div>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          💰 Finance Tracker
        </button>
        <button 
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          📈 Performance
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="overview-tab">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏠</div>
              <div className="stat-content">
                <div className="stat-number">{stats.overall_stats.total_visits_done}</div>
                <div className="stat-label">Total Visits</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{stats.overall_stats.total_confirmed}</div>
                <div className="stat-label">Confirmed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{stats.overall_stats.total_pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-number">{stats.overall_stats.total_declined}</div>
                <div className="stat-label">Declined</div>
              </div>
            </div>
          </div>

          <div className="performance-chart">
            <h3>Caller Performance</h3>
            <div className="performance-list">
              {stats.caller_stats.map(caller => (
                <div key={caller.caller_id} className="performance-item">
                  <div className="caller-info">
                    <div className="caller-name">{caller.caller_name}</div>
                    <div className="caller-metrics">
                      Visits: {caller.visits_done} | Confirmed: {caller.visits_confirmed}
                    </div>
                  </div>
                  <div className="conversion-rate">
                    <div className="rate-bar">
                      <div 
                        className="rate-fill" 
                        style={{ 
                          width: `${caller.conversion_rate}%`,
                          backgroundColor: caller.conversion_rate >= 50 ? '#4caf50' : 
                                         caller.conversion_rate >= 25 ? '#ff9800' : '#f44336'
                        }}
                      />
                    </div>
                    <span>{caller.conversion_rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="finance-tab">
          <div className="finance-summary">
            <div className="summary-card earned">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <div className="card-amount">₹{transactions.reduce((sum, t) => t.type === 'earn' ? sum + t.amount : sum, 0)}</div>
                <div className="card-label">Total Earned</div>
              </div>
            </div>
            <div className="summary-card spent">
              <div className="card-icon">📉</div>
              <div className="card-content">
                <div className="card-amount">₹{transactions.reduce((sum, t) => t.type === 'spend' ? sum + t.amount : sum, 0)}</div>
                <div className="card-label">Total Spent</div>
              </div>
            </div>
          </div>

          <div className="transactions-tracker">
            <h3>💳 Transaction History</h3>
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className={`transaction-row ${transaction.type}`}>
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
          </div>
        </div>
      )}

      {activeTab === 'performance' && stats && (
        <div className="performance-tab">
          <div className="performance-metrics">
            <div className="metric-card">
              <h4>Conversion Rate</h4>
              <div className="metric-value">
                {stats.overall_stats.total_visits_done > 0 
                  ? Math.round((stats.overall_stats.total_confirmed / stats.overall_stats.total_visits_done) * 100)
                  : 0}%
              </div>
            </div>
            <div className="metric-card">
              <h4>Success Rate</h4>
              <div className="metric-value">
                {stats.overall_stats.total_confirmed + stats.overall_stats.total_declined > 0
                  ? Math.round((stats.overall_stats.total_confirmed / (stats.overall_stats.total_confirmed + stats.overall_stats.total_declined)) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .supervisor-dashboard {
          padding: 2rem;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .month-display {
          font-size: 1.2rem;
          font-weight: 500;
        }

        .tab-navigation {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: #007bff;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
        }

        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }

        .performance-chart {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .performance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #f1f3f4;
        }

        .caller-name {
          font-weight: 500;
        }

        .caller-metrics {
          font-size: 0.8rem;
          color: #666;
        }

        .conversion-rate {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rate-bar {
          width: 100px;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .rate-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .finance-summary {
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

        .transactions-tracker {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .transaction-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #f1f3f4;
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

        .performance-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .metric-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          color: #007bff;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default SupervisorDashboard;