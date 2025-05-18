import { useState, useEffect } from "react";
import axios from "axios";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        axios.get("http://localhost:5000/api/users/userlist")
            .then(response => {
                setUsers(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching users:", error);
                setLoading(false);
            });
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStatusChange = (userId) => {
        // TODO: Implement status change logic with API call
        console.log(`Toggling status for user ${userId}`);
    };

    return (
        <div className="container-fluid py-4 px-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">User Management</h2>
                    <p className="text-muted">Manage and monitor user accounts</p>
                </div>
                <button className="btn btn-primary">
                    <i className="bi bi-plus-lg me-2"></i>
                    Add New User
                </button>
            </div>

            {/* Search and Filter Section */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-center">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-transparent">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-auto ms-auto">
                            <select className="form-select">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-circle me-2">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`badge ${Number(user.status) === 1 ? "bg-success" : "bg-danger"}`}>
                                                    <i className={`bi ${Number(user.status) === 1 ? "bi-check-circle" : "bi-x-circle"} me-1`}></i>
                                                    {Number(user.status) === 1 ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button 
                                                        className={`btn btn-sm ${Number(user.status) === 1 ? "btn-outline-danger" : "btn-outline-success"}`}
                                                        onClick={() => handleStatusChange(user.id)}
                                                    >
                                                        <i className={`bi ${Number(user.status) === 1 ? "bi-pause-fill" : "bi-play-fill"} me-1`}></i>
                                                        {Number(user.status) === 1 ? "Deactivate" : "Activate"}
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-primary ms-2">
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <i className="bi bi-inbox display-4 d-block mb-2 text-muted"></i>
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .avatar-circle {
                        width: 32px;
                        height: 32px;
                        background-color: #e9ecef;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 500;
                        color: #6c757d;
                    }
                    .table th {
                        font-weight: 600;
                        background-color: #f8f9fa;
                    }
                    .badge {
                        padding: 0.5em 0.8em;
                    }
                    .btn-group .btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .card {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .form-control, .form-select {
                        border-radius: 0.375rem;
                    }
                    .input-group-text {
                        border-right: none;
                    }
                    .form-control:focus {
                        border-color: #86b7fe;
                        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                    }
                `}
            </style>
        </div>
    );
};

export default UserManagement;
