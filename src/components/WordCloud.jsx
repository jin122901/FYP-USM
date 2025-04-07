import React, { useState, useEffect } from "react";

const WordCloud = ({ filePath }) => {
  const [wordCloudUrl, setWordCloudUrl] = useState("");
  const [sentiment, setSentiment] = useState("all");

  useEffect(() => {
    if (filePath) {
      fetchWordCloud(sentiment);
    }
  }, [filePath, sentiment]);

  const fetchWordCloud = (sentiment) => {
    const url = `http://localhost:5000/api/file/wordcloud-image?filePath=${encodeURIComponent(filePath)}&sentiment=${sentiment}`;
    console.log("Fetching:", url);
    setWordCloudUrl(url);
  };

  return (
    <div className="card shadow-sm p-3 text-center h-100">
      <h5 className="fw-bold mb-3">Word Cloud of {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}</h5>

      {/* Buttons to Switch Word Cloud */}
      <div className="btn-group mb-3">
        <button className="btn btn-primary" onClick={() => setSentiment("all")}>All</button>
        <button className="btn btn-danger" onClick={() => setSentiment("negative")}>Negative</button>
        <button className="btn btn-secondary" onClick={() => setSentiment("neutral")}>Neutral</button>
        <button className="btn btn-success" onClick={() => setSentiment("positive")}>Positive</button>
      </div>

      {/* Display Word Cloud Image */}
      {wordCloudUrl ? (
        <img src={wordCloudUrl} alt="Word Cloud" style={{ width: "100%", height: "290px" }} />
      ) : (
        <p>No word cloud available</p>
      )}
    </div>
  );
};

export default WordCloud;
