import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function RegisterForm() {
    const [formData, setFormData] = useState({ name: "", email: "", password: "", industry: "", Cpassword: "" });
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Check if passwords match before sending to backend
        if (formData.password !== formData.Cpassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            // ✅ FIXED: Correct API URL with /api/register
            const response = await axios.post("http://127.0.0.1:5000/api/register", formData, {
                headers: { "Content-Type": "application/json" },
            });

            setMessage(response.data.message);
            alert(response.data.message);

            // ✅ Clear form after successful registration
            setFormData({ name: "", email: "", password: "", industry: "", Cpassword: "" });

            // ✅ Redirect user to login page
            window.location.href = "/login";
        } catch (error) {
            // ✅ FIXED: Use `.error` instead of `.message`
            if (error.response && error.response.data && error.response.data.error) {
                alert(error.response.data.error);
            } else {
                alert("Error registering user");
            }
            console.error(error);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h2 className="text-center">Registration Form</h2>
                    <form onSubmit={handleSubmit} className="php-email-form" data-aos="fade-up" data-aos-delay="200">
                        <div className="mb-3">
                            <label htmlFor="name-field" className="form-label">Name</label>
                            <input type="text" className="form-control" name="name" id="name-field" required 
                                value={formData.name} onChange={handleChange} />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email-field" className="form-label">Email</label>
                            <input type="email" className="form-control" name="email" id="email-field" required 
                                value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="industry-field" className="form-label">Industry</label>
                            <input type="text" className="form-control" name="industry" id="industry-field" required 
                                value={formData.industry} onChange={handleChange} />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password-field" className="form-label">Password</label>
                            <input type="password" className="form-control" name="password" id="password-field" required 
                                value={formData.password} onChange={handleChange} />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="Cpassword-field" className="form-label">Confirm Password</label>
                            <input type="password" className="form-control" name="Cpassword" id="Cpassword-field" required 
                                value={formData.Cpassword} onChange={handleChange} />
                        </div>

                        <div className="text-center">
                            <button type="submit" className="btn btn-primary">Submit</button>
                        </div>

                        <p className="text-center mt-3">
                            If you already have an account, <Link to="/login">click here to login</Link>.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegisterForm;
