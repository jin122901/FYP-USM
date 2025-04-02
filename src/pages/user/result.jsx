import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import GaugeMeter from "../../components/GaugeMeter";

const ResultPage = () => {
  const { fileId } = useParams();
  const [filePath, setFilePath] = useState(null);
  const [rowCount, setRowCount] = useState(0);
  const [courseName, setCourseName] = useState("");
  const [sentimentCounts, setSentimentCounts] = useState({
    negative: 0,
    neutral: 0,
    positive: 0,
  });

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        console.log("Fetching file details for:", fileId);
        const response = await axios.get(`http://localhost:5000/api/file/get_file_details/${fileId}`);
        console.log("API Response:", response.data);
    
        const { file_path, course_name } = response.data;
        setFilePath(file_path);
        setCourseName(course_name);
    
        if (file_path) {
          console.log("Fetching CSV data from:", file_path);
          const csvResponse = await axios.get(`http://localhost:5000/api/file/read-csv`, { 
            params: { filePath: file_path } 
          });
          console.log("CSV Response:", csvResponse.data);
    
          setRowCount(csvResponse.data.totalRows);
      
          // Directly extract sentiment counts from response
          setSentimentCounts({
            negative: csvResponse.data.negative || 0,
            neutral: csvResponse.data.neutral || 0,
            positive: csvResponse.data.positive || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching file data:", error);
      }
    };
  
    if (fileId) {
      fetchFileData();
    }
  }, [fileId]);

  return (
    <div className="container mt-4">
      {/* Course Name Section */}
      <div className="text-center mb-4">
        <h2 className="fw-bold">Results for {courseName || "Loading..."}</h2>
      </div>

      {/* Sentiment Data */}
      <div className="row">
        {/* Total Rows */}
        <div className="col-md-3">
          <div className="card text-white bg-primary mb-3">
            <div className="card-body text-center">
              <h5 className="card-title">Total Rows</h5>
              <p className="card-text fs-4 fw-bold">{rowCount}</p>
            </div>
          </div>
        </div>

        {/* Average Sentiment Gauge */}
        <div className="col-md-9">
          <GaugeMeter sentimentCounts={sentimentCounts} />
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
