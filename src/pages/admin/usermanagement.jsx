import { useState, useEffect } from "react";
import axios from "axios";

const UserManagement = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        axios.get("http://localhost:5000/api/userlist") // Ensure the backend route exists
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error("Error fetching users:", error);
            });
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-3">User Management</h2>
            <div className="table-responsive">
                <table className="table table-bordered table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${Number(user.status) === 1 ? "bg-success" : "bg-danger"}`}>
                                            {Number(user.status) === 1 ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-warning btn-sm" onClick={() => console.log(`User ${user.id} Inactivated!`)}>
                                            Inactivate
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center">No users found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
