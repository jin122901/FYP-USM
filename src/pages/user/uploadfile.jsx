import React, { useState } from "react";
import axios from "axios";

function UploadForm() {
    const [file, setFile] = useState(null);
    const [coursename, setCoursename] = useState("");
    const [error, setError] = useState("");

    const allowedTypes = [
        "application/vnd.ms-excel", 
        "text/csv", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) {
            setError("Please select a file.");
            return;
        }
        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
            event.target.value = "";
            return;
        }
        setFile(selectedFile);
        setError("");
    };

    const handleCourseChange = (event) => {
        setCoursename(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError("Please select a valid file before submitting.");
            return;
        }
        if (!coursename.trim()) {
            setError("Course name is required.");
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("coursename", coursename);
        try {
            const response = await axios.post("http://localhost:5000/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            alert("File uploaded successfully!");
            console.log(response.data);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload file.");
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Get insight from your Student</h2>
            <div className="d-flex justify-content-end mb-3">
                <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#uploadModal">
                    Add Feedback
                </button>
            </div>
            
            <div className="modal fade" id="uploadModal" tabIndex="-1" aria-labelledby="uploadModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="uploadModalLabel">Upload Excel or CSV File</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="file-field" className="form-label">Upload File</label>
                                    <input type="file" className="form-control" id="file-field" accept=".csv, .xls, .xlsx" onChange={handleFileChange} required />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="coursename" className="form-label">Course Name</label>
                                    <input type="text" className="form-control" id="coursename" value={coursename} onChange={handleCourseChange} required />
                                </div>
                                {error && <p className="text-danger">{error}</p>}
                                <div className="text-center">
                                    <button type="submit" className="btn btn-primary">Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <table className="table mt-4">
                <thead className="table-light">
                    <tr>
                        <th>#</th>
                        <th>Course Name</th>
                        <th>Uploaded File</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>Example Course</td>
                        <td>feedback.xlsx</td>
                        <td>2025-03-11</td>
                        <td>
                            <button className="btn btn-info btn-sm me-2">View</button>
                            <button className="btn btn-danger btn-sm">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default UploadForm;