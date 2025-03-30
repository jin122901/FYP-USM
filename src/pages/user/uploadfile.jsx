import React, { useState, useEffect } from "react";
import axios from "axios";

function UploadForm() {
    const [file, setFile] = useState(null);
    const [coursename, setCoursename] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = () => {
        axios.get("http://localhost:5000/api/file/files", { withCredentials: true })
            .then(response => {
                const formattedFiles = response.data.files.map(file => ({
                    file_id: file[0],
                    filename: file[1],
                    file_path: file[2],
                    coursename: file[3],
                    user_id: file[4],
                    upload_at: file[5],
                    statusprocess: file[6]
                }));
                setFileList(formattedFiles);
            })
            .catch(error => console.error("Error fetching files:", error));
    };

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
        setError("");
        setSuccessMessage("");
    
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
            const response = await axios.post("http://localhost:5000/api/file/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
            });
    
            // Check if the backend explicitly sends an error message
            if (response.data.error) {
                setError(response.data.error);
                return;
            }
    
            setSuccessMessage("✅ File uploaded successfully! Sentiment analysis in process.");
    
            // Close modal after a slight delay
            setTimeout(() => {
                const modalElement = document.getElementById("uploadModal");
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) modalInstance.hide();
            }, 500);
    
            // Refresh file list
            fetchFiles();
        } catch (error) {
            console.error("Upload error:", error);
    
            // Show the correct error message
            setError(error.response?.data?.error || "❌ File upload failed. Please try again.");
        }
    };
    
    

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Get insight from your Student</h2>
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {successMessage}
                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            )}
           
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
                            <div className="alert alert-info" role="alert">
                                <strong>📌 File Upload Requirements</strong>
                                <button className="btn btn-sm btn-link text-primary" type="button" data-bs-toggle="collapse" data-bs-target="#fileRequirements">
                                    (View Details)
                                </button>
                                <div className="collapse mt-2" id="fileRequirements">
                                    <ul className="list-unstyled">
                                        <li>🔹 <strong>Allowed Formats:</strong> CSV (.csv), Excel (.xlsx)</li>
                                        <li>🔹 <strong>Max File Size:</strong> 10MB</li>
                                        <li>🔹 <strong>Required Column:</strong> "Feedback"</li>
                                        <li>🔹 <strong>Optional Columns:</strong> "StudentID", "Date", etc.</li>
                                        <li>✅ No empty rows & proper formatting</li>
                                        <li>✅ Use UTF-8 encoding</li>
                                        <li>❌ Invalid formats (e.g., .txt, .pdf, .docx) are not accepted</li>
                                        <li>❌ Missing "Feedback" column = File rejected</li>
                                    </ul>
                                </div>
                            </div>
                            {successMessage && <p className="text-success">{successMessage}</p>}
                            {error && <p className="text-danger">{error}</p>}
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
                        <th>Progress</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {fileList.length > 0 ? (
                        fileList.map((file, index) => (
                        <tr key={file.file_id || index}>
                            <td>{index + 1}</td>
                            <td>{file.coursename}</td>
                            <td>{file.filename}</td>
                            <td>{file.upload_at ? new Date(file.upload_at).toLocaleDateString() : "N/A"}</td>
                            <td>
                                <div className="progress">
                                    <div
                                        className={`progress-bar ${file.statusprocess < 100 ? "progress-bar-striped progress-bar-animated" : "bg-success"}`}
                                        role="progressbar"
                                        style={{ width: `${file.statusprocess}%` }}
                                    >
                                        {file.statusprocess}%
                                    </div>
                                </div>
                            </td>


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
