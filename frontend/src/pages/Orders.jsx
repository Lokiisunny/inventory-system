import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Eye, X, RefreshCw, PlusCircle, MinusCircle } from 'lucide-react';
import { orderAPI, customerAPI, productAPI } from '../services/api';

function Orders({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form State for new order
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, max_qty: 0, price: 0 }
  ]);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const ordersRes = await orderAPI.getAll();
      setOrders(ordersRes.data);

      const customersRes = await customerAPI.getAll();
      setCustomers(customersRes.data);

      const productsRes = await productAPI.getAll();
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching initial orders data", error);
      showToast("Failed to load order management services", "danger");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    // Refresh product stock list to have up-to-date options
    try {
      const productsRes = await productAPI.getAll();
      setProducts(productsRes.data);
    } catch (e) {
      console.error(e);
    }

    setCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1, max_qty: 0, price: 0 }]);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleAddProductLine = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, max_qty: 0, price: 0 }]);
  };

  const handleRemoveProductLine = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      updated[index].product_id = value;
      updated[index].max_qty = product ? product.quantity : 0;
      updated[index].price = product ? parseFloat(product.price) : 0;
      // Default quantity to 1 or max available if max < 1
      updated[index].quantity = product && product.quantity > 0 ? 1 : 0;
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value) || 0;
    }
    setOrderItems(updated);
  };

  const calculatePreviewTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (item.price * (item.quantity || 0));
    }, 0);
  };

  const validateOrderForm = () => {
    const errors = {};
    if (!customerId) errors.customer_id = "Please select a customer";

    const itemErrors = [];
    orderItems.forEach((item, idx) => {
      const itemErr = {};
      if (!item.product_id) {
        itemErr.product_id = "Select product";
      } else {
        if (item.quantity <= 0) {
          itemErr.quantity = "Must be >= 1";
        } else if (item.quantity > item.max_qty) {
          itemErr.quantity = `Insuff. stock (Max ${item.max_qty})`;
        }
      }
      if (Object.keys(itemErr).length > 0) {
        itemErrors[idx] = itemErr;
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!validateOrderForm()) return;

    try {
      const dataToSubmit = {
        customer_id: customerId,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      await orderAPI.create(dataToSubmit);
      showToast("Order created successfully", "success");
      setModalOpen(false);
      fetchInitialData();
    } catch (error) {
      console.error("Error creating order", error);
      const backendMessage = error.response?.data?.detail || "Failed to process order";
      showToast(backendMessage, "danger");
    }
  };

  const handleCancelOrder = async (id) => {
    if (window.confirm("Are you sure you want to cancel and delete this order? All inventory stock will be restored.")) {
      try {
        await orderAPI.delete(id);
        showToast("Order cancelled and deleted successfully", "success");
        fetchInitialData();
      } catch (error) {
        console.error("Error deleting order", error);
        const backendMessage = error.response?.data?.detail || "Failed to delete order";
        showToast(backendMessage, "danger");
      }
    }
  };

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Sales Orders</h2>
          <p>Create new purchase transactions, monitor order totals, view details, and manage inventory cancellations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchInitialData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openCreateModal} disabled={customers.length === 0 || products.length === 0}>
            <Plus size={16} /> Create Order
          </button>
        </div>
      </div>

      {customers.length === 0 && !loading && (
        <div className="alert alert-danger">
          <div className="alert-message">
            <strong>Action Required:</strong> You must register at least one Customer in the Customer tab before creating an order.
          </div>
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="alert alert-danger">
          <div className="alert-message">
            <strong>Action Required:</strong> You must add Products in the Products tab before creating an order.
          </div>
        </div>
      )}

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading Sales Orders...</p>
        </div>
      ) : (
        <div className="section-card" style={{ padding: '0', overflow: 'hidden' }}>
          {orders.length > 0 ? (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Date & Time</th>
                    <th>Items Count</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.id.slice(0, 8)}...</td>
                      <td style={{ fontWeight: 600 }}>{order.customer?.name || "Unknown Customer"}</td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                      <td>{order.items?.length || 0} items</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>${parseFloat(order.total_amount).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${order.status === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-secondary btn-icon" 
                            title="View Details"
                            onClick={() => viewOrderDetails(order)}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon" 
                            title="Cancel & Delete Order"
                            onClick={() => handleCancelOrder(order.id)}
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
              <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3>No Orders Found</h3>
              <p style={{ marginTop: '8px' }}>There are no processed sales transactions. Create an order to deduct inventory and view totals.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '20px' }} 
                onClick={openCreateModal}
                disabled={customers.length === 0 || products.length === 0}
              >
                <Plus size={16} /> Create Order
              </button>
            </div>
          )}
        </div>
      )}

      {/* CREATE ORDER MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Compose Sales Order</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOrderSubmit}>
              <div className="modal-body">
                {/* Select Customer */}
                <div className="form-group">
                  <label className="form-label">Client Reference</label>
                  <select 
                    className="form-control"
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      if (formErrors.customer_id) setFormErrors({ ...formErrors, customer_id: null });
                    }}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                  {formErrors.customer_id && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.customer_id}</span>}
                </div>

                {/* Items Builder */}
                <div className="form-group">
                  <label className="form-label">Products Ordered</label>
                  
                  <div className="order-items-builder">
                    <div className="builder-headers">
                      <div>Product</div>
                      <div>Unit Price</div>
                      <div>Quantity</div>
                      <div>Actions</div>
                    </div>

                    {orderItems.map((item, idx) => (
                      <div key={idx} className="builder-row">
                        <div>
                          <select
                            className="form-control"
                            value={item.product_id}
                            onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          >
                            <option value="">Select Catalog Item...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                                {p.name} {p.quantity <= 0 ? '(OUT OF STOCK)' : `(${p.quantity} avail.)`}
                              </option>
                            ))}
                          </select>
                          {formErrors.items?.[idx]?.product_id && (
                            <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{formErrors.items[idx].product_id}</span>
                          )}
                        </div>

                        <div style={{ paddingLeft: '8px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                          {item.price > 0 ? `$${item.price.toFixed(2)}` : '—'}
                        </div>

                        <div>
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            max={item.max_qty}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            disabled={!item.product_id}
                          />
                          {formErrors.items?.[idx]?.quantity && (
                            <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{formErrors.items[idx].quantity}</span>
                          )}
                        </div>

                        <div>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            disabled={orderItems.length === 1}
                            onClick={() => handleRemoveProductLine(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button 
                      type="button" 
                      className="btn btn-secondary btn-icon" 
                      style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.85rem' }}
                      onClick={handleAddProductLine}
                    >
                      <PlusCircle size={14} /> Add Product Row
                    </button>
                  </div>
                </div>

                {/* Preview Summary */}
                <div className="order-summary-box">
                  <span className="summary-total-label">Subtotal Estimate (computed by frontend):</span>
                  <span className="summary-total-value">${calculatePreviewTotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Process Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {detailsModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Order Receipt: #{selectedOrder.id.slice(0, 16)}...</h3>
              <button className="modal-close-btn" onClick={() => setDetailsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Customer Information
                  </h4>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedOrder.customer?.name}</p>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{selectedOrder.customer?.email}</p>
                  <p style={{ color: 'var(--text-muted)' }}>{selectedOrder.customer?.phone}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Order Details
                  </h4>
                  <p><strong>Order Timestamp:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  <p style={{ marginTop: '4px' }}>
                    <strong>Fulfillment Status:</strong>{' '}
                    <span className="badge badge-success">{selectedOrder.status}</span>
                  </p>
                </div>
              </div>

              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Purchase Breakdown
              </h4>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Quantity Purchased</th>
                      <th>Price at Purchase</th>
                      <th>Row Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.product?.name || "Unknown Product"}</td>
                        <td><span className="badge badge-sku">{item.product?.sku}</span></td>
                        <td>{item.quantity}</td>
                        <td>${parseFloat(item.price_at_order).toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>${(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <td colSpan="4" style={{ textAlign: 'right', fontWeight: 700 }}>Total Calculated by Backend:</td>
                      <td style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                        ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailsModalOpen(false)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
