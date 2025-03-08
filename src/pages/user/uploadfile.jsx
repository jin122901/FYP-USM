import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function UploadForm() {

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h2 className="text-center">Upload Form</h2>
                    <form onSubmit={handleSubmit} className="php-email-form" data-aos="fade-up" data-aos-delay="200">
                        <div className="mb-3">
                            <label htmlFor="name-field" className="form-label">Name</label>
                            <input type="file" className="form-control" name="file" id="name-field" required />
                        </div>

                        <div className="text-center">
                            <button type="submit" className="btn btn-primary">Submit</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default UploadForm;
