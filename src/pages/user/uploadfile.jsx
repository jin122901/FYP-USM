import React, { useState, useEffect } from "react";
import axios from "axios";

function UploadForm() {
    const [file, setFile] = useState(null);
    const [coursename, setCoursename] = useState("");
    const [error, setError] = useState("");
    const [fileList, setFileList] = useState([]);  // Store uploaded files

    useEffect(() => {
        axios.get("http://localhost:5000/api/file/files", { withCredentials: true })
            .then(response => setFiles(response.data.files))
            .catch(error => console.error("Error fetching files:", error));
    }, []);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) {
            setError("Please select a file.");
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
            await axios.post("http://localhost:5000/api/file/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
            });
            alert("File uploaded successfully!");
            fetchFiles();  // Refresh file list after upload
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

            {/* Upload Modal */}
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
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        id="file-field" 
                                        accept=".csv, .xls, .xlsx" 
                                        onChange={handleFileChange} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="coursename" className="form-label">Course Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="coursename" 
                                        value={coursename} 
                                        onChange={handleCourseChange} 
                                        required 
                                    />
                                </div>
                                {error && <p className="text-danger">{error}</p>}
                                <div className="text-center">
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-upload"></i> Submit
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* File List Table */}
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
                    {fileList.length > 0 ? (
                        fileList.map((file, index) => (
                            <tr key={file.file_id}>
                                <td>{index + 1}</td>
                                <td>{file.course}</td>  {/* Updated coursename → course */}
                                <td>{file.filename}</td>
                                <td>{file.upload_date ? new Date(file.upload_date).toLocaleDateString() : "N/A"}</td> {/* Safe date parsing */}
                                <td>
                                    <button className="btn btn-info btn-sm me-2">Results</button>
                                    <button className="btn btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center">No files uploaded yet.</td>
                        </tr>
                    )}
                </tbody>

            </table>
        </div>
    );
}

export default UploadForm;
