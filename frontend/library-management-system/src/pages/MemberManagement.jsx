import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User, CheckCircle, XCircle, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const MemberManagement = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    membershipPlan: 'STANDARD',
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    membershipFee: 0
  });

  const [errors, setErrors] = useState({});

  const membershipPlans = [
    { value: 'STANDARD', label: 'Standard', maxBooks: 3, fee: 0, days: 14, color: 'blue' },
    { value: 'PREMIUM', label: 'Premium', maxBooks: 5, fee: 500, days: 21, color: 'purple' },
    { value: 'GOLD', label: 'Gold', maxBooks: 10, fee: 1000, days: 30, color: 'yellow' }
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [members, searchTerm, filterStatus, filterPlan]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:1205/librario/api/members', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch members');

      const data = await response.json();
      const membersList = data.data || data;
      console.log('✅ Members loaded:', membersList);
      setMembers(Array.isArray(membersList) ? membersList : []);
    } catch (error) {
      console.error('❌ Error fetching members:', error);
      toast.error('Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = members;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        member.fullName?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search) ||
        member.phone?.includes(search)
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(member => member.accountStatus === filterStatus);
    }

    if (filterPlan) {
      filtered = filtered.filter(member => member.membershipPlan === filterPlan);
    }

    setFilteredMembers(filtered);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!isEditing && !formData.password) newErrors.password = 'Password is required';
    if (!isEditing && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `http://localhost:1205/librario/api/members/${formData.id}`
        : 'http://localhost:1205/librario/api/members';

      const method = isEditing ? 'PUT' : 'POST';

      const payload = { ...formData };
      if (isEditing) delete payload.password;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(payload)

      });

      if (!response.ok) throw new Error('Failed to save member');

      toast.success(isEditing ? 'Member updated successfully!' : 'Member created successfully!');
      resetForm();
      setShowModal(false);
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Failed to save member');
    }
  };

  const handleEdit = (member) => {
    setCurrentMember(member);
    setFormData({
      id: member.id,
      email: member.email,
      password: '',
      fullName: member.fullName,
      phone: member.phone || '',
      address: member.address || '',
      membershipPlan: member.membershipPlan,
      membershipStartDate: member.membershipStartDate,
      membershipExpiryDate: member.membershipExpiryDate,
      membershipFee: member.membershipFee
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;

    try {
      const token = localStorage.getItem('token');

      console.log('Deleting member ID:', memberId);

      const response = await fetch(`http://localhost:1205/librario/api/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        throw new Error(errorData.message || 'Failed to delete member');
      }

      toast.success('Member deleted successfully!');

      // Refresh the member list
      await fetchMembers();

      console.log('Member list refreshed');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error(error.message || 'Failed to delete member');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      address: '',
      membershipPlan: 'STANDARD',
      membershipStartDate: new Date().toISOString().split('T')[0],
      membershipExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      membershipFee: 0
    });
    setErrors({});
    setIsEditing(false);
    setCurrentMember(null);
  };

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'GOLD': return 'background: #fef3c7; color: #92400e';
      case 'PREMIUM': return 'background: #f3e8ff; color: #6b21a8';
      default: return 'background: #dbeafe; color: #1e40af';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading members...</p>
      </div>
    );
  }

  return (
    <div className="page-animate" style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(-1)} className="btn btn-outline">
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>👥 Member Management</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                Manage library members and subscriptions
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Add Member
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-input-icon">
                <Search className="form-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="form-input"
              >
                <option value="">All Plans</option>
                {membershipPlans.map(plan => (
                  <option key={plan.value} value={plan.value}>{plan.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div className="empty-state">
            <User size={64} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>No members found</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              {members.length === 0 ? 'Add your first member to get started' : 'Try adjusting your search filters'}
            </p>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Showing <strong>{filteredMembers.length}</strong> of <strong>{members.length}</strong> members
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {filteredMembers.map(member => (
                <div key={member.id} className="card" style={{ height: '100%' }}>
                  <div className="card-body">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.25rem',
                          fontWeight: 'bold'
                        }}>
                          {member.fullName?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                            {member.fullName}
                          </h3>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            ID: #{member.id}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          marginBottom: '0.5rem',
                          ...Object.fromEntries(getPlanBadgeColor(member.membershipPlan).split(';').map(s => s.trim().split(':').map(p => p.trim())))
                        }}>
                          {member.membershipPlan}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          {member.isMembershipActive ? (
                            <>
                              <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} style={{ color: 'var(--error)' }} />
                              <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 500 }}>Expired</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Mail size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Phone size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{member.phone}</span>
                        </div>
                      )}
                      {member.address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <MapPin size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: '0.2rem' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{member.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem',
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Books Borrowed
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-600)' }}>
                          {member.currentlyBorrowed || 0}/{member.maxBooksAllowed || 0}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Membership Fee
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                          ₹{member.membershipFee || 0}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Start Date
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {new Date(member.membershipStartDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Expires
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {new Date(member.membershipExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => handleEdit(member)}
                        className="btn btn-outline"
                        style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem' }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="btn btn-danger"
                        style={{ flex: 1, fontSize: '0.875rem', padding: '0.625rem' }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal modal-large">
              <div className="modal-header">
                <h2 className="modal-title">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
                <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                    />
                    {errors.email && <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{errors.email}</p>}
                  </div>

                  {!isEditing && (
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="form-input"
                      />
                      {errors.password && <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{errors.password}</p>}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="form-input"
                    />
                    {errors.fullName && <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{errors.fullName}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-input"
                      placeholder="10 digits"
                    />
                    {errors.phone && <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>{errors.phone}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Membership Plan *</label>
                    <select
                      value={formData.membershipPlan}
                      onChange={(e) => {
                        const plan = membershipPlans.find(p => p.value === e.target.value);
                        setFormData({
                          ...formData,
                          membershipPlan: e.target.value,
                          membershipFee: plan?.fee || 0
                        });
                      }}
                      className="form-input"
                    >
                      {membershipPlans.map(plan => (
                        <option key={plan.value} value={plan.value}>
                          {plan.label} - {plan.maxBooks} books, ₹{plan.fee}, {plan.days} days
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={formData.membershipStartDate}
                      onChange={(e) => setFormData({ ...formData, membershipStartDate: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.membershipExpiryDate}
                      onChange={(e) => setFormData({ ...formData, membershipExpiryDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="2"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {isEditing ? 'Update Member' : 'Add Member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManagement;