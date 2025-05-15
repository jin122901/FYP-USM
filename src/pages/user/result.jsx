import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import DonutChart from "../../components/SentimentChart";
import TopicChart from "../../components/TopicChart";
import SentimentByTopicChart from "../../components/SentimentByTopicChart";
import WordCloud from "../../components/WordCloud";

const ResultPage = () => {
  const { fileId } = useParams();
  const [filePath, setFilePath] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [columnData, setColumnData] = useState({});
  const [selectedColumn, setSelectedColumn] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to handle the back button click
  const handleGoBack = () => {
    navigate(-1); // This will navigate to the previous page in history
  };

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        console.log("Fetching file details for:", fileId);
        const response = await axios.get(`http://localhost:5000/api/file/get_file_details/${fileId}`);
        console.log("API Response:", response.data);

        const { file_path, course_name, suggestion } = response.data;
        setFilePath(file_path);
        setCourseName(course_name);
        setSuggestion(suggestion);

        if (file_path) {
          console.log("Fetching CSV data from:", file_path);
          const csvResponse = await axios.get(`http://localhost:5000/api/file/read-csv`, { 
            params: { filePath: file_path } 
          });
          console.log("CSV Response:", csvResponse.data);

          setRowCount(csvResponse.data.totalRows);
          setColumnData(csvResponse.data.columns || {});
          
          // Set the first column as selected by default
          const columns = Object.keys(csvResponse.data.columns || {});
          if (columns.length > 0) {
            setSelectedColumn(columns[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching file data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchFileData();
    }
  }, [fileId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Get the current selected column data
  const currentColumnData = selectedColumn ? columnData[selectedColumn] || {} : {};
  const sentimentCounts = currentColumnData.sentiment || { negative: 0, neutral: 0, positive: 0 };
  const topicCounts = currentColumnData.topics || {};
  const sentimentByTopic = currentColumnData.sentiment_by_topic || {};

  return (
    <div className="container mt-4">
      <div className="mb-4">
        <button 
          className="btn btn-outline-primary" 
          onClick={handleGoBack}
        >Back</button>
        <h2 className="text-center fw-bold">Results for {courseName || "Loading..."}</h2>
      </div>

      {/* Column selector */}
      {Object.keys(columnData).length > 1 && (
        <div className="row mb-4">
          <div className="col-md-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Select Column to View</h5>
                <div className="btn-group">
                  {Object.keys(columnData).map(column => (
                    <button
                      key={column}
                      className={`btn ${selectedColumn === column ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSelectedColumn(column)}
                    >
                      {column.replace('Sentiment_', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mt-4">
        <div className="col-md-6">
          <TopicChart topicCounts={topicCounts} />
        </div>
        
        <div className="col-md-6">
          <SentimentByTopicChart sentimentByTopic={sentimentByTopic} />
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <DonutChart sentimentCounts={sentimentCounts} />
        </div>
        
        <div className="col-md-6" >
          <WordCloud filePath={filePath} columnName={selectedColumn} />
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-lightbulb me-2"></i>
                Suggested Improvements
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex">
                <div className="flex-shrink-0">
                  <i className="bi bi-info-circle-fill text-primary fs-4"></i>
                </div>
                <div className="ms-3">
                  <p className="card-text">{suggestion || "Loading suggestions..."}</p>
                </div>
              </div>
            </div>
            <div className="card-footer bg-light">
              <small className="text-muted">Based on analysis of feedback data</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
