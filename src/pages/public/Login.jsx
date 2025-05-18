import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage({ text: "", type: "" }); // Clear any error messages when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/api/login", formData, { withCredentials: true });

            setMessage({ text: "Login successful! Redirecting...", type: "success" });
            localStorage.setItem("user_email", response.data.email);
            localStorage.setItem("user_type", response.data.user_type);
            
            // Delay navigation slightly to show success message
            setTimeout(() => {
                if (response.data.user_type === 0) {
                    navigate("/admin");
                } else {
                    navigate("/user");
                }
            }, 1000);
        } catch (error) {
            setMessage({ 
                text: error.response?.data?.error || "Login failed. Please check your credentials.", 
                type: "error" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center py-5" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-5">
                        <div className="card shadow-lg border-0">
                            <div className="card-body p-5">
                                <div className="text-center mb-4">
                                    <h1 className="h3 mb-3 fw-normal">Welcome Back!</h1>
                                    <p className="text-muted">Please sign in to continue</p>
                                </div>

                                {message.text && (
                                    <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                                        <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                                        {message.text}
                                        <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="needs-validation">
                                    <div className="form-floating mb-3">
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            id="email-field"
                                            name="email"
                                            placeholder="name@example.com"
                                            required 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        <label htmlFor="email-field">Email address</label>
                                    </div>

                                    <div className="form-floating mb-4">
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            className="form-control" 
                                            id="password-field"
                                            name="password"
                                            placeholder="Password"
                                            required 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        <label htmlFor="password-field">Password</label>
                                        <button 
                                            type="button"
                                            className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none pe-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ zIndex: 5 }}
                                        >
                                            <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                        </button>
                                    </div>

                                    <div className="d-grid mb-4">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary py-3" 
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Signing in...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                                    Sign in
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-center text-muted">
                                        Don't have an account?{' '}
                                        <Link to="/RegisterPage" className="text-decoration-none">
                                            Create one now
                                            <i className="bi bi-arrow-right ms-2"></i>
                                        </Link>
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .form-floating > .form-control:focus,
                    .form-floating > .form-control:not(:placeholder-shown) {
                        padding-top: 1.625rem;
                        padding-bottom: 0.625rem;
                    }
                    .form-floating > .form-control:focus ~ label,
                    .form-floating > .form-control:not(:placeholder-shown) ~ label {
                        opacity: .65;
                        transform: scale(.85) translateY(-0.5rem) translateX(0.15rem);
                    }
                    .form-control:focus {
                        border-color: #86b7fe;
                        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                    }
                    .card {
                        border-radius: 1rem;
                    }
                    .btn-primary {
                        background-color: #0d6efd;
                        border-color: #0d6efd;
                        transition: all 0.2s;
                    }
                    .btn-primary:hover {
                        background-color: #0b5ed7;
                        border-color: #0a58ca;
                        transform: translateY(-1px);
                    }
                    .alert {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .form-floating > .form-control {
                        border-radius: 0.5rem;
                    }
                `}
            </style>
        </div>
    );
}

export default LoginPage;
