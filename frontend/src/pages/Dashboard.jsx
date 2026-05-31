import React, { useState, useEffect } from 'react';
import { Package, Users, ShoppingCart, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { dashboardAPI, productAPI } from '../services/api';

function Dashboard({ setActiveTab, showToast }) {
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: 0,
  });
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await dashboardAPI.getStats();
      setStats(statsRes.data);

      const productsRes = await productAPI.getAll();
      const lowStockItems = productsRes.data.filter(p => p.quantity < 10);
      setLowStockList(lowStockItems);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      showToast("Failed to load dashboard metrics", "danger");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Overview Dashboard</h2>
          <p>Real-time inventory level, order fulfillment, and client list metrics.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData}>
          <Activity size={16} /> Refresh Stats
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="dashboard-grid">
        <div className="stat-card" style={{ '--card-color': 'var(--color-primary)' }}>
          <div className="stat-icon">
            <Package size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.total_products}</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-color': 'var(--color-info)' }}>
          <div className="stat-icon">
            <Users size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Customers</span>
            <span className="stat-value">{stats.total_customers}</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-color': 'var(--color-success)' }}>
          <div className="stat-icon">
            <ShoppingCart size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats.total_orders}</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-color': stats.low_stock_products > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
          <div className="stat-icon">
            <AlertTriangle size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value">{stats.low_stock_products}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Quick Actions Panel */}
        <div>
          <div className="section-card">
            <div className="section-title">
              <h2>Quick Actions</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '20px', flexDirection: 'column', gap: '8px', height: 'auto' }}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingCart size={24} />
                <span>Create New Order</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '20px', flexDirection: 'column', gap: '8px', height: 'auto', border: '1px solid var(--border-light)' }}
                onClick={() => setActiveTab('products')}
              >
                <Package size={24} />
                <span>Manage Inventory</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '20px', flexDirection: 'column', gap: '8px', height: 'auto', border: '1px solid var(--border-light)' }}
                onClick={() => setActiveTab('customers')}
              >
                <Users size={24} />
                <span>View Customer Directory</span>
              </button>
            </div>
          </div>
          
          <div className="section-card">
            <div className="section-title">
              <h2>System Information</h2>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p>Welcome to the <strong>Inventory & Order Management Portal</strong>. The backend runs on high-performance FastAPI server utilizing PostgreSQL relational model. Product SKU checks, negative quantities, customer duplicate constraints, and inventory reduction upon orders are fully automated and verified within transactional boundaries.</p>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="section-card" style={{ height: 'fit-content' }}>
          <div className="section-title">
            <h2>
              <AlertTriangle size={18} color="var(--color-danger)" /> 
              Stock Warnings
            </h2>
          </div>
          <div className="low-stock-list">
            {lowStockList.length > 0 ? (
              lowStockList.map((item) => (
                <div key={item.id} className="low-stock-item">
                  <div className="low-stock-item-info">
                    <span className="low-stock-name">{item.name}</span>
                    <span className="low-stock-sku">{item.sku}</span>
                  </div>
                  <span className="low-stock-qty">{item.quantity} left</span>
                </div>
              ))
            ) : (
              <div className="low-stock-empty">
                All inventory quantities are healthy. No items are below the safety threshold.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
