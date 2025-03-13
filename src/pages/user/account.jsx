import React, { useState, useEffect } from "react";
import axios from "axios";

function AccountDetails() {
    const [formData, setFormData] = useState({ name: "", email: "", industry: "" });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "" });
    const [passwordMessage, setPasswordMessage] = useState("");
    
    useEffect(() => {
        const fetchUserDetails = async () => {
            console.log("Fetching user details..."); // Debugging
    
            try {
                const response = await axios.get("http://localhost:5000/api/account", { withCredentials: true });
                console.log("API Response:", response.data); // Debugging
    
                if (Array.isArray(response.data) && response.data.length === 3) {
                    setFormData({
                        name: response.data[0],
                        email: response.data[1],
                        industry: response.data[2]
                    });
                    setLoading(false); // Stop loading
                } else {
                    console.error("Unexpected API response format");
                    setMessage("Invalid data format received.");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                setMessage("Failed to load account details.");
                setLoading(false);
            }
        };
    
        fetchUserDetails();
    }, []);
    
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
            setMessage(response.data.message || "Account details updated successfully.");
        } catch (error) {
            console.error("Error updating account:", error);
            setMessage("Failed to update details.");
        }
    };
    
    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };
    
    
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!passwordData.oldPassword || !passwordData.newPassword) {
            setPasswordMessage("Please fill in both fields.");
            return;
        }
        try {
            const response = await axios.put("http://localhost:5000/api/change-password", passwordData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
            });
            setPasswordMessage(response.data.message || "Password updated successfully.");
            setPasswordData({ oldPassword: "", newPassword: "" });
        } catch (error) {
            console.error("Error updating password:", error);
            setPasswordMessage("Failed to update password.");
        }
    };
    
    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h2 className="text-center">Account Details</h2>
                    {message && <p className="text-center text-success">{message}</p>}
                    {loading ? (
                        <p className="text-center">Loading...</p>
                    ) : (
                        <>
                            <table className="table">
                                <tbody>
                                    <tr><td><strong>Name:</strong></td><td>{formData.name}</td></tr>
                                    <tr><td><strong>Email:</strong></td><td>{formData.email}</td></tr>
                                    <tr><td><strong>Industry:</strong></td><td>{formData.industry}</td></tr>
                                </tbody>
                            </table>
                            <div className="text-center">
                                <button className="btn btn-warning" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
                            </div>
                        </>
                    )}
                    
                    <div className="modal fade" id="editModal" tabIndex="-1" aria-hidden="true">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Account</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <form onSubmit={handleSaveChanges}>
                                        <div className="mb-3">
                                            <label className="form-label">Name</label>
                                            <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Industry</label>
                                            <input type="text" className="form-control" name="industry" value={formData.industry} onChange={handleChange} required />
                                        </div>
                                        <div className="text-center">
                                            <button type="submit" className="btn btn-primary">Save Changes</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr />
                    <h3 className="text-center mt-4">Change Password</h3>
                    {passwordMessage && <p className="text-center text-danger">{passwordMessage}</p>}
                    <form onSubmit={handlePasswordUpdate}>
                        <div className="mb-3">
                            <label className="form-label">Old Password</label>
                            <input type="password" className="form-control" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">New Password</label>
                            <input type="password" className="form-control" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required />
                        </div>
                        <div className="text-center">
                            <button type="submit" className="btn btn-danger">Update Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AccountDetails;
