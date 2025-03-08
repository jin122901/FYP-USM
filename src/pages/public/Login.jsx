import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Use navigate for redirect
import axios from 'axios';

function LoginPage() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://127.0.0.1:5000/api/login", formData, { withCredentials: true });

            
            localStorage.setItem("user_type", response.data.user_type);
            if (response.data.user_type === 0) {
                navigate("/admin");  // Redirect admin to admin page
            } else {
                navigate("/user");  // Redirect user to user page
            }
        } catch (error) {
            alert(error.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h2 className="text-center">Login</h2>
                    <form onSubmit={handleSubmit} className="php-email-form" data-aos="fade-up" data-aos-delay="200">
                    
                        <div className="mb-3">
                            <label htmlFor="email-field" className="form-label">Your Email</label>
                            <input type="email" className="form-control" name="email" id="email-field" required onChange={handleChange} />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password-field" className="form-label">Password</label>
                            <input type="password" className="form-control" name="password" id="password-field" required onChange={handleChange} />
                        </div>

                        <div className="text-center">
                            <button type="submit" className="btn btn-primary">Login</button>
                        </div>
                        {message && <p className="text-center text-danger">{message}</p>} {/* Show error message if exists */}
                        <p className="text-center mt-3">
                            If you don't have an account, <Link to="/RegisterPage">click here to register</Link>.
                        </p>
                        
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
