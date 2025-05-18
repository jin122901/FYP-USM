import React, { useState, useEffect } from "react";
import axios from "axios";

const WordCloud = ({ filePath, columnName }) => {
  const [wordCloudUrl, setWordCloudUrl] = useState("");
  const [sentiment, setSentiment] = useState("all");
  const [topic, setTopic] = useState("all");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available topics when component mounts or columnName changes
  useEffect(() => {
    if (filePath && columnName) {
      fetchTopics();
    }
  }, [filePath, columnName]);

  // Update word cloud when filters change
  useEffect(() => {
    if (filePath) {
      fetchWordCloud();
    }
  }, [filePath, sentiment, topic, columnName]);

  const fetchTopics = async () => {
    try {
      // Extract the base column name to get topics
      const baseColumnName = columnName.replace("Sentiment_", "");
      const response = await axios.get(`http://localhost:5000/api/file/read-csv`, {
        params: { filePath, columns: [columnName] }
      });
      
      if (response.data && response.data.columns && response.data.columns[columnName]) {
        const availableTopics = Object.keys(response.data.columns[columnName].topics || {});
        setTopics(availableTopics);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setError("Failed to load topics");
    }
  };

  const fetchWordCloud = () => {
    setLoading(true);
    const url = `http://localhost:5000/api/file/wordcloud-image?filePath=${encodeURIComponent(filePath)}&sentiment=${sentiment}&column=${encodeURIComponent(columnName || '')}&topic=${encodeURIComponent(topic)}`;
    console.log("Fetching word cloud:", url);
    
    // Force reload image by adding timestamp
    setWordCloudUrl(`${url}&t=${new Date().getTime()}`);
    setLoading(false);
  };

  const getSentimentButtonClass = (sentimentType) => {
    if (sentiment === sentimentType) {
      // Active button
      switch(sentimentType) {
        case 'negative': return 'btn btn-danger';
        case 'neutral': return 'btn btn-secondary';
        case 'positive': return 'btn btn-success';
        default: return 'btn btn-primary';
      }
    } else {
      // Inactive button
      switch(sentimentType) {
        case 'negative': return 'btn btn-outline-danger';
        case 'neutral': return 'btn btn-outline-secondary';
        case 'positive': return 'btn btn-outline-success';
        default: return 'btn btn-outline-primary';
      }
    }
  };

  return (
    <div className="card shadow-sm p-3 text-center h-70">
      <h5 className="fw-bold mb-3">Word Cloud</h5>

      {/* Sentiment Filter Buttons */}
      <div className="mb-3">
        <label className="d-block mb-2">Filter by Sentiment:</label>
        <div className="btn-group">
          <button 
            className={getSentimentButtonClass("all")} 
            onClick={() => setSentiment("all")}
          >
            All
          </button>
          <button 
            className={getSentimentButtonClass("positive")} 
            onClick={() => setSentiment("positive")}
          >
            Positive
          </button>
          <button 
            className={getSentimentButtonClass("neutral")} 
            onClick={() => setSentiment("neutral")}
          >
            Neutral
          </button>
          <button 
            className={getSentimentButtonClass("negative")} 
            onClick={() => setSentiment("negative")}
          >
            Negative
          </button>
        </div>
      </div>

      {/* Topic Filter Dropdown */}
      {topics.length > 0 && (
        <div className="mb-3">
          <label className="d-block mb-2">Filter by Topic:</label>
          <select 
            className="form-select" 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="all">All Topics</option>
            {topics.map((topicName) => (
              <option key={topicName} value={topicName}>{topicName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Display Word Cloud Image */}
      <div className="mt-3 word-cloud-container" style={{ minHeight: "250px" }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : wordCloudUrl ? (
          <img 
            src={wordCloudUrl} 
            alt={`Word Cloud for ${sentiment} sentiment ${topic !== 'all' ? `in ${topic}` : ''}`}
            className="img-fluid" 
            style={{ maxHeight: "290px", width: "100%" }}
            onError={() => setError("Failed to load word cloud")}
          />
        ) : (
          <p>No word cloud available</p>
        )}
      </div>
      
      <div className="mt-2 text-muted small">
        <p>Words are colored based on their sentiment analysis</p>
      </div>
    </div>
  );
};

export default WordCloud;