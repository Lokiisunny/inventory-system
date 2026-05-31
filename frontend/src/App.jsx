import React, { useState, useEffect } from 'react';
import { LayoutGrid, Package, Users, ShoppingCart, Info, Globe, Menu, ShieldAlert } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import apiClient from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connected, setConnected] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Connection Check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiClient.get('/');
        setConnected(true);
      } catch (err) {
        setConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically dismiss toast after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} showToast={showToast} />;
      case 'products':
        return <Products showToast={showToast} />;
      case 'customers':
        return <Customers showToast={showToast} />;
      case 'orders':
        return <Orders showToast={showToast} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} showToast={showToast} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'products': return 'Inventory Catalog';
      case 'customers': return 'Customer Directory';
      case 'orders': return 'Sales & Invoices';
      default: return 'Management Portal';
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notifications System */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="toast-body" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{toast.message}</span>
              <span style={{ opacity: 0.5, fontSize: '0.8rem', paddingLeft: '12px' }}>×</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <ShoppingCart size={18} color="#ffffff" />
          </div>
          <span className="sidebar-logo-text">InventoryPro</span>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <button 
              className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <LayoutGrid size={18} />
              <span>Dashboard</span>
            </button>
          </li>
          <li className="sidebar-item">
            <button 
              className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <Package size={18} />
              <span>Products</span>
            </button>
          </li>
          <li className="sidebar-item">
            <button 
              className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveTab('customers'); setSidebarOpen(false); }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <Users size={18} />
              <span>Customers</span>
            </button>
          </li>
          <li className="sidebar-item">
            <button 
              className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <ShoppingCart size={18} />
              <span>Orders</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div>System Console v1.0</div>
          <div style={{ marginTop: '4px', fontSize: '0.7rem' }}>Fully Containerized</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="btn btn-secondary btn-icon" 
              style={{ display: 'none' /* toggles on small screen */ }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <div className="header-title">
              <h1>{getPageTitle()}</h1>
            </div>
          </div>

          <div className="header-meta">
            <div className={`badge-server ${connected ? '' : 'disconnected'}`}>
              <div className={`status-dot ${connected ? 'pinging' : ''}`}></div>
              <span>{connected ? 'API ONLINE' : 'API OFFLINE'}</span>
            </div>
          </div>
        </header>

        <main className="content-container">
          {!connected && (
            <div className="alert alert-danger" style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '0 0 24px 0' }}>
              <ShieldAlert size={20} className="alert-icon" />
              <div className="alert-message">
                <strong>Connection Error:</strong> Frontend is unable to connect to the backend server at <code>{apiClient.defaults.baseURL}</code>. Verify the database & API container are running.
              </div>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
