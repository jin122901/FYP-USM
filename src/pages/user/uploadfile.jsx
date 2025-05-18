import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UploadForm() {
    const [file, setFile] = useState(null);
    const [coursename, setCoursename] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fileList, setFileList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filePreview, setFilePreview] = useState(null);
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [pendingDeleteFileId, setPendingDeleteFileId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleDelete = (fileId) => {
        // Set the file ID to delete
        setPendingDeleteFileId(fileId);
        
        // Try different methods to open the modal
        try {
            // Method 1: Using Bootstrap's global object if available
            if (window.bootstrap && window.bootstrap.Modal) {
                const deleteModal = new window.bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
                deleteModal.show();
            } 
            // Method 2: Fallback to jQuery if available
            else if (window.$ && $('#deleteConfirmationModal').modal) {
                $('#deleteConfirmationModal').modal('show');
            }
            // Method 3: Last resort - trigger with a manual click
            else {
                const modalTrigger = document.createElement('button');
                modalTrigger.setAttribute('data-bs-toggle', 'modal');
                modalTrigger.setAttribute('data-bs-target', '#deleteConfirmationModal');
                document.body.appendChild(modalTrigger);
                modalTrigger.click();
                document.body.removeChild(modalTrigger);
            }
        } catch (error) {
            console.error("Error showing modal:", error);
            // If all else fails, use a browser confirm as fallback
            if (window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
                confirmDeleteFile();
            }
        }
    };

    const confirmDeleteFile = async () => {
        if (!pendingDeleteFileId) return;
    
        try {
            const response = await axios.delete(`http://localhost:5000/api/file/files/deleteFile/${pendingDeleteFileId}`, {
                withCredentials: true,
            });

            if (response.data.success) {
                // Refresh files first
                await fetchFiles();
                
                // Then attempt to close the modal with a try-catch to prevent errors
                try {
                    // Try different methods to close the modal
                    if (window.bootstrap && window.bootstrap.Modal) {
                        const deleteModal = window.bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
                        if (deleteModal) {
                            deleteModal.hide();
                        }
                    } 
                    // jQuery fallback
                    else if (window.$ && $('#deleteConfirmationModal').modal) {
                        $('#deleteConfirmationModal').modal('hide');
                    }
                } catch (modalError) {
                    console.warn("Error closing modal:", modalError);
                    // Modal closing error shouldn't affect the user experience
                }
                
                // Show success message after everything else
                alert('File deleted successfully!');
            } else {
                alert('Failed to delete the file.');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Error deleting file. Please try again.');
        } finally {
            // Reset the pending delete file ID
            setPendingDeleteFileId(null);
        }
    };

    const fetchFiles = (searchQuery = "", page = 1) => {
        axios.get("http://localhost:5000/api/file/files", {
            params: { search: searchQuery, page: page, limit: 10 },
            withCredentials: true
        })
        .then(response => {
            console.log("API Response:", response.data);
    
            const filesData = response.data.files?.files; 
    
            if (!Array.isArray(filesData)) {
                console.error("Error: Expected an array but got", filesData);
                setFileList([]);
                return;
            }
    
            const formattedFiles = filesData.map(file => ({
                fileid: file.fileid,
                filename: file.filename,
                file_path: file.file_path,
                coursename: file.coursename,
                uploaded_at: file.uploaded_at,
                statusprocess: file.statusprocess || 0
            }));
    
            setFileList(formattedFiles);
            setCurrentPage(response.data.files.current_page || 1);
            setTotalPages(response.data.files.total_pages || 1);
        })
        .catch(error => console.error("Error fetching files:", error));
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            console.log("Fetching files for search:", searchQuery);
            fetchFiles(searchQuery);
        }, 300);
    
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) {
            setError("Please select a file.");
            return;
        }
        setFile(selectedFile);
        setError("");
        
        // Preview the file to show columns
        await previewFile(selectedFile);
        
        // Close the first modal
        const uploadModal = document.getElementById("uploadModal");
        const uploadModalInstance = bootstrap.Modal.getInstance(uploadModal);
        if (uploadModalInstance) {
            uploadModalInstance.hide();
        }
    };

    const previewFile = async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const response = await axios.post("http://localhost:5000/api/file/preview_file", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
            });
            
            if (response.data.error) {
                setError(response.data.error);
                return;
            }
            
            // Set the file preview data
            setFilePreview({
                filename: response.data.filename,
                rowCount: response.data.rowCount
            });
            
            // Set available columns and initialize all as selected
            const availableColumns = response.data.columns;
            setColumns(availableColumns);
            setSelectedColumns(availableColumns);
            
            // Set preview data for display
            setPreviewData(response.data.preview);
            
            setTimeout(() => {
                try {
                    const modalElement = document.getElementById("columnSelectionModal");
                    if (window.bootstrap && window.bootstrap.Modal) {
                        const modalBootstrap = new window.bootstrap.Modal(modalElement);
                        modalBootstrap.show();
                    } else {
                        // Fallback to click the button that triggers the modal
                        const modalTrigger = document.createElement('button');
                        modalTrigger.setAttribute('data-bs-toggle', 'modal');
                        modalTrigger.setAttribute('data-bs-target', '#columnSelectionModal');
                        document.body.appendChild(modalTrigger);
                        modalTrigger.click();
                        document.body.removeChild(modalTrigger);
                    }
                } catch (err) {
                    console.error("Error opening modal:", err);
                    // Fallback method
                    const modalElement = document.getElementById("columnSelectionModal");
                    modalElement.classList.add("show");
                    modalElement.style.display = "block";
                    document.body.classList.add("modal-open");
                }
            }, 300); // Small delay to ensure Bootstrap is loaded
            
        } catch (error) {
            console.error("File preview error:", error);
            setError(error.response?.data?.error || "Error previewing file");
        }
    };

    const handleCourseChange = (event) => {
        setCoursename(event.target.value);
    };

    const handleColumnSelection = (column) => {
        setSelectedColumns(prevSelected => {
            if (prevSelected.includes(column)) {
                return prevSelected.filter(col => col !== column);
            } else {
                return [...prevSelected, column];
            }
        });
    };

    const handleSelectAllColumns = (event) => {
        if (event.target.checked) {
            setSelectedColumns([...columns]);
        } else {
            setSelectedColumns([]);
        }
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
        if (selectedColumns.length === 0) {
            setError("Please select at least one column for analysis.");
            return;
        }
    
        const formData = new FormData();
        formData.append("file", file);
        formData.append("coursename", coursename);
        
        // Try both ways to ensure the backend receives the data
        formData.append("columns", JSON.stringify(selectedColumns));
        
        // For debugging - log what's being sent
        console.log("Selected columns:", selectedColumns);
        console.log("JSON string:", JSON.stringify(selectedColumns));
    
        try {
            const response = await axios.post("http://localhost:5000/api/file/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
            });
    
            if (response.data.error) {
                setError(response.data.error);
                return;
            }
    
            setSuccessMessage("✅ File uploaded successfully! Sentiment analysis in process.");
    
            // Close modals after a slight delay
            setTimeout(() => {
                const uploadModal = document.getElementById("uploadModal");
                const columnModal = document.getElementById("columnSelectionModal");
                const uploadModalInstance = bootstrap.Modal.getInstance(uploadModal);
                const columnModalInstance = bootstrap.Modal.getInstance(columnModal);
                
                if (columnModalInstance) columnModalInstance.hide();
                if (uploadModalInstance) uploadModalInstance.hide();
                
                // Reset form
                setFile(null);
                setCoursename("");
                setColumns([]);
                setSelectedColumns([]);
                setFilePreview(null);
                setPreviewData([]);
            }, 500);
    
            // Refresh file list
            fetchFiles();
        } catch (error) {
            console.error("Upload error:", error);
            setError(error.response?.data?.error || "❌ File upload failed. Please try again.");
        }
    };

    return (
        <div className="container-fluid py-4 px-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Student Feedback Analysis</h2>
                    <p className="text-muted">Upload and analyze student feedback data</p>
                </div>
                <button 
                    className="btn btn-primary d-flex align-items-center" 
                    data-bs-toggle="modal" 
                    data-bs-target="#uploadModal"
                >
                    <i className="bi bi-cloud-upload me-2"></i>
                    Upload Feedback
                </button>
            </div>

            {/* Search and Stats Section */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card shadow-sm">
                        <div className="card-body d-flex align-items-center">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                <i className="bi bi-file-text text-primary fs-4"></i>
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Total Files</h6>
                                <h3 className="mb-0">{fileList?.length || 0}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card shadow-sm">
                        <div className="card-body d-flex align-items-center">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                <i className="bi bi-check-circle text-success fs-4"></i>
                            </div>
                            <div>
                                <h6 className="text-muted mb-1">Processed</h6>
                                <h3 className="mb-0">
                                    {fileList?.filter(file => file.statusprocess === 100).length || 0}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search text-muted"></i>
                        </span>
                        <input 
                            type="text" 
                            className="form-control border-start-0 ps-0" 
                            placeholder="Search by course name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* File List Card */}
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th className="fw-semibold">#</th>
                                    <th className="fw-semibold">Course Name</th>
                                    <th className="fw-semibold">File Name</th>
                                    <th className="fw-semibold">Upload Date</th>
                                    <th className="fw-semibold">Status</th>
                                    <th className="fw-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fileList?.length > 0 ? (
                                    fileList.map((file, index) => (
                                        <tr key={file.fileid || index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-circle me-2">
                                                        {file.coursename?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {file.coursename}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-file-earmark-text me-2 text-muted"></i>
                                                    {file.filename}
                                                </div>
                                            </td>
                                            <td>{file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : "N/A"}</td>
                                            <td style={{ width: "200px" }}>
                                                <div className="d-flex align-items-center">
                                                    <div className="progress flex-grow-1" style={{ height: "8px" }}>
                                                        <div
                                                            className={`progress-bar ${
                                                                file.statusprocess < 100 
                                                                    ? "progress-bar-striped progress-bar-animated bg-primary" 
                                                                    : "bg-success"
                                                            }`}
                                                            style={{ width: `${file.statusprocess}%` }}
                                                        />
                                                    </div>
                                                    <span className="ms-2 small">{file.statusprocess}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary" 
                                                        disabled={file.statusprocess !== 100}
                                                        onClick={() => navigate(`/resultpage/${file.fileid}`)}
                                                    >
                                                        <i className="bi bi-graph-up me-1"></i>
                                                        View Results
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger ms-2"
                                                        onClick={() => handleDelete(file.fileid)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-muted">
                                                <i className="bi bi-inbox display-4 d-block mb-3"></i>
                                                <p className="mb-0">No files uploaded yet</p>
                                                <button 
                                                    className="btn btn-primary mt-3" 
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#uploadModal"
                                                >
                                                    Upload Your First File
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {fileList?.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <p className="text-muted mb-0">
                                Showing page {currentPage} of {totalPages}
                            </p>
                            <div className="btn-group">
                                <button 
                                    className="btn btn-outline-primary" 
                                    disabled={currentPage === 1} 
                                    onClick={() => fetchFiles("", currentPage - 1)}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                                <button 
                                    className="btn btn-outline-primary" 
                                    disabled={currentPage === totalPages} 
                                    onClick={() => fetchFiles("", currentPage + 1)}
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Keep existing modals but add some styling */}
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
                    .card {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .table th {
                        background-color: #f8f9fa;
                        font-weight: 600;
                    }
                    .progress {
                        background-color: #e9ecef;
                        border-radius: 10px;
                    }
                    .progress-bar {
                        border-radius: 10px;
                    }
                    .btn-group .btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .input-group-text {
                        background-color: transparent;
                    }
                    .modal-content {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .modal-header {
                        background-color: #f8f9fa;
                        border-bottom: 1px solid #e9ecef;
                    }
                    .modal-footer {
                        background-color: #f8f9fa;
                        border-top: 1px solid #e9ecef;
                    }
                `}
            </style>

            {/* Delete Confirmation Modal */}
            <div className="modal fade" id="deleteConfirmationModal" tabIndex="-1" aria-labelledby="deleteConfirmationModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="deleteConfirmationModalLabel">Confirm Deletion</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-warning">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Are you sure you want to delete this file? This action cannot be undone.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={confirmDeleteFile}>Delete File</button>
                        </div>
                    </div>
                </div>
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
                                <form>
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
                                    <div className="alert alert-primary" role="alert">
                                        After selecting a file, you'll be able to choose which columns to analyze.
                                    </div>
                                </form>
                            </div>
                    </div>
                </div>
            </div>

            {/* Column Selection Modal */}
            <div className="modal fade" id="columnSelectionModal" tabIndex="-1" aria-labelledby="columnSelectionModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="columnSelectionModalLabel">
                                Configure Analysis
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            {filePreview && (
                                <div className="mb-3">
                                    <h6>File: {filePreview.filename}</h6>
                                    <p>Total rows: {filePreview.rowCount}</p>
                                </div>
                            )}
                            
                            <div className="mb-4">
                                <label htmlFor="coursename" className="form-label">Course Name</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="coursename" 
                                    value={coursename} 
                                    onChange={handleCourseChange} 
                                    required 
                                    placeholder="Enter the course name"
                                />
                            </div>
                            
                            <h6 className="mb-3">Select Columns to Analyze:</h6>
                            <div className="mb-3">
                                <div className="form-check mb-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="selectAllColumns"
                                        checked={selectedColumns.length === columns.length && columns.length > 0}
                                        onChange={handleSelectAllColumns}
                                    />
                                    <label className="form-check-label" htmlFor="selectAllColumns">
                                        <strong>Select All Columns</strong>
                                    </label>
                                </div>
                                
                                <div className="row column-checkboxes mt-2">
                                    {columns.map((column, index) => (
                                        <div className="col-md-4 mb-2" key={index}>
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`column-${index}`}
                                                    checked={selectedColumns.includes(column)}
                                                    onChange={() => handleColumnSelection(column)}
                                                />
                                                <label className="form-check-label" htmlFor={`column-${index}`}>
                                                    {column}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {previewData.length > 0 && (
                                <div className="mb-3">
                                    <h6>Data Preview:</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-striped table-bordered">
                                            <thead>
                                                <tr>
                                                    {columns.map((column, index) => (
                                                        <th key={index} className={selectedColumns.includes(column) ? 'table-primary' : ''}>
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        {columns.map((column, colIndex) => (
                                                            <td key={colIndex} className={selectedColumns.includes(column) ? 'table-primary' : ''}>
                                                                {row[column]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                data-bs-dismiss="modal"
                                onClick={handleSubmit}
                                disabled={selectedColumns.length === 0 || !coursename.trim()}
                            >
                                Process Selected Columns
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UploadForm;