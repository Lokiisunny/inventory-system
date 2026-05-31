import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { productAPI } from '../services/api';

function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    quantity: '',
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll();
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products", error);
      showToast("Failed to fetch product inventory", "danger");
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
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.sku.trim()) errors.sku = "SKU is required";
    if (!formData.name.trim()) errors.name = "Name is required";
    
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum)) {
      errors.price = "Price is required";
    } else if (priceNum < 0) {
      errors.price = "Price cannot be negative";
    }

    const qtyNum = parseInt(formData.quantity);
    if (isNaN(qtyNum)) {
      errors.quantity = "Quantity is required";
    } else if (qtyNum < 0) {
      errors.quantity = "Quantity cannot be negative";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setFormData({ sku: '', name: '', price: '', quantity: '' });
    setFormErrors({});
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
    });
    setFormErrors({});
    setCurrentId(product.id);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const dataToSubmit = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
      };

      if (isEditing) {
        await productAPI.update(currentId, dataToSubmit);
        showToast("Product updated successfully", "success");
      } else {
        await productAPI.create(dataToSubmit);
        showToast("Product created successfully", "success");
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product", error);
      const backendMessage = error.response?.data?.detail || "Failed to save product details";
      showToast(backendMessage, "danger");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productAPI.delete(id);
        showToast("Product deleted successfully", "success");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product", error);
        const backendMessage = error.response?.data?.detail || "Failed to delete product";
        showToast(backendMessage, "danger");
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Product Inventory</h2>
          <p>Add, edit and monitor catalog products, base pricing, and physical stock levels.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchProducts}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading Product Directory...</p>
        </div>
      ) : (
        <div className="section-card" style={{ padding: '0', overflow: 'hidden' }}>
          {products.length > 0 ? (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Quantity In Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td><span className="badge badge-sku">{product.sku}</span></td>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td>${parseFloat(product.price).toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>{product.quantity}</td>
                      <td>
                        {product.quantity === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : product.quantity < 10 ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Healthy</span>
                        )}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn btn-secondary btn-icon" 
                            title="Edit Product"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-danger btn-icon" 
                            title="Delete Product"
                            onClick={() => handleDeleteProduct(product.id)}
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
              <Package size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3>No Products Found</h3>
              <p style={{ marginTop: '8px' }}>Your database does not contain any catalog entries yet. Get started by adding a product.</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={openAddModal}>
                <Plus size={16} /> Add Product
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
              <h3>{isEditing ? "Edit Catalog Product" : "Register New Product"}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">SKU / Code</label>
                  <input
                    type="text"
                    name="sku"
                    className="form-control"
                    placeholder="e.g. PROD-1029"
                    value={formData.sku}
                    onChange={handleInputChange}
                    disabled={isEditing} // Typically SKU shouldn't be mutable on edit
                  />
                  {formErrors.sku && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.sku}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Mechanical Keyboard"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                  {formErrors.name && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.name}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      className="form-control"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                    {formErrors.price && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.price}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity in Stock</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                    {formErrors.quantity && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{formErrors.quantity}</span>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
