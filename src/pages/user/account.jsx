import React, { useState, useEffect } from "react";
import axios from "axios";

function AccountDetails() {
    const [formData, setFormData] = useState({ name: "", email: "", industry: "" });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
    const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        fetchUserDetails();
    }, []);

    const fetchUserDetails = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/account", { withCredentials: true });
            if (Array.isArray(response.data) && response.data.length === 3) {
                setFormData({
                    name: response.data[0],
                    email: response.data[1],
                    industry: response.data[2]
                });
            } else {
                setMessage({ text: "Invalid data format received.", type: "error" });
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            setMessage({ text: "Failed to load account details.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put("http://localhost:5000/api/account", formData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
            });
            setMessage({ 
                text: response.data.message || "Account details updated successfully.", 
                type: "success" 
            });
            // Close modal after successful update
            const modal = document.getElementById('editModal');
            const modalInstance = window.bootstrap.Modal.getInstance(modal);
            if (modalInstance) modalInstance.hide();
        } catch (error) {
            console.error("Error updating account:", error);
            setMessage({ text: "Failed to update details.", type: "error" });
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!passwordData.oldPassword || !passwordData.newPassword) {
            setPasswordMessage({ text: "Please fill in both fields.", type: "error" });
            return;
        }
        try {
            const response = await axios.put("http://localhost:5000/api/change-password", passwordData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
            });
            setPasswordMessage({ 
                text: response.data.message || "Password updated successfully.", 
                type: "success" 
            });
            setPasswordData({ oldPassword: "", newPassword: "" });
        } catch (error) {
            console.error("Error updating password:", error);
            setPasswordMessage({ text: "Failed to update password.", type: "error" });
        }
    };

    return (
        <div className="container-fluid py-4 px-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Account Settings</h2>
                    <p className="text-muted">Manage your profile and security settings</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {/* Profile Card */}
                    <div className="col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="card-title mb-0">Profile Information</h5>
                                    <button 
                                        className="btn btn-outline-primary btn-sm" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#editModal"
                                    >
                                        <i className="bi bi-pencil me-2"></i>
                                        Edit Profile
                                    </button>
                                </div>
                                {message.text && (
                                    <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                                        {message.text}
                                        <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
                                    </div>
                                )}
                                <div className="profile-info">
                                    <div className="mb-4 text-center">
                                        <div className="avatar-circle mx-auto mb-3">
                                            {formData.name?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="info-group mb-3">
                                        <label className="text-muted small">Full Name</label>
                                        <p className="mb-3 fs-5">{formData.name}</p>
                                    </div>
                                    <div className="info-group mb-3">
                                        <label className="text-muted small">Email Address</label>
                                        <p className="mb-3 fs-5">{formData.email}</p>
                                    </div>
                                    <div className="info-group">
                                        <label className="text-muted small">Industry</label>
                                        <p className="mb-0 fs-5">{formData.industry}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password Card */}
                    <div className="col-md-6">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title mb-4">Security Settings</h5>
                                {passwordMessage.text && (
                                    <div className={`alert alert-${passwordMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                                        {passwordMessage.text}
                                        <button type="button" className="btn-close" onClick={() => setPasswordMessage({ text: "", type: "" })}></button>
                                    </div>
                                )}
                                <form onSubmit={handlePasswordUpdate}>
                                    <div className="mb-4">
                                        <label className="form-label text-muted small">Current Password</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light">
                                                <i className="bi bi-lock"></i>
                                            </span>
                                            <input 
                                                type="password" 
                                                className="form-control" 
                                                name="oldPassword" 
                                                value={passwordData.oldPassword} 
                                                onChange={handlePasswordChange} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label text-muted small">New Password</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light">
                                                <i className="bi bi-key"></i>
                                            </span>
                                            <input 
                                                type="password" 
                                                className="form-control" 
                                                name="newPassword" 
                                                value={passwordData.newPassword} 
                                                onChange={handlePasswordChange} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">
                                        <i className="bi bi-shield-lock me-2"></i>
                                        Update Password
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            <div className="modal fade" id="editModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Profile</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSaveChanges}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Industry</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="industry" 
                                        value={formData.industry} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div className="d-grid">
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-check2 me-2"></i>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .avatar-circle {
                        width: 80px;
                        height: 80px;
                        background-color: #e9ecef;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2rem;
                        font-weight: 500;
                        color: #6c757d;
                    }
                    .card {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .info-group label {
                        margin-bottom: 0.25rem;
                    }
                    .input-group-text {
                        border: none;
                    }
                    .form-control {
                        border-radius: 0.375rem;
                    }
                    .form-control:focus {
                        border-color: #86b7fe;
                        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                    }
                    .modal-content {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .modal-header {
                        background-color: #f8f9fa;
                        border-bottom: 1px solid #e9ecef;
                    }
                    .btn {
                        padding: 0.5rem 1rem;
                    }
                    .alert {
                        border: none;
                        border-radius: 0.375rem;
                    }
                `}
            </style>
        </div>
    );
}

export default AccountDetails;
