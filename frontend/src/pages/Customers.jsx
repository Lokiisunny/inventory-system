import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { customerAPI } from '../services/api';

function Customers({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers", error);
      showToast("Failed to fetch customer directory", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email format is invalid";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setFormData({ name: '', email: '', phone: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const dataToSubmit = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      await customerAPI.create(dataToSubmit);
      showToast("Customer registered successfully", "success");
      setModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer", error);
      const backendMessage = error.response?.data?.detail || "Failed to register customer";
      showToast(backendMessage, "danger");
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer? This action is permanent.")) {
      try {
        await customerAPI.delete(id);
        showToast("Customer profile deleted successfully", "success");
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer", error);
        const backendMessage = error.response?.data?.detail || "Failed to delete customer profile";
        showToast(backendMessage, "danger");
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Customer Directory</h2>
          <p>Register and maintain client directories, contact methods, and billing details.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchCustomers}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading Customer Profiles...</p>
        </div>
      ) : (
        <div className="section-card" style={{ padding: '0', overflow: 'hidden' }}>
          {customers.length > 0 ? (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Registration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td style={{ fontWeight: 600 }}>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-danger btn-icon" 
                            title="Delete Profile"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3>No Customers Found</h3>
              <p style={{ marginTop: '8px' }}>There are no registered clients in the database. Get started by adding a customer profile.</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={openAddModal}>
                <Plus size={16} /> Add Customer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Customer</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {formErrors.name && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {formErrors.email && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    placeholder="+1 (555) 012-3456"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {formErrors.phone && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.phone}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
