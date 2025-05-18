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
  const [feedbackData, setFeedbackData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  // Add new state for filters
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedSentiment, setSelectedSentiment] = useState("all");

  // Function to handle the back button click
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    
    try {
      // Create a new document
      const reportWindow = window.open('', '_blank');
      
      if (!reportWindow) {
        alert('Please allow popups for this website to export the report.');
        setIsExporting(false);
        return;
      }

      // Function to convert SVG to image data URL
      const svgToImage = async (svgElement) => {
        if (!svgElement) return null;
        
        try {
          // Get the SVG data
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          return URL.createObjectURL(svgBlob);
        } catch (error) {
          console.error('Error converting SVG to image:', error);
          return null;
        }
      };

      // Capture chart SVGs
      const donutChartSvg = document.querySelector('#donut-chart svg');
      const topicChartSvg = document.querySelector('#topic-chart svg');
      const sentimentByTopicSvg = document.querySelector('#sentiment-by-topic-chart svg');
      const wordCloudSvg = document.querySelector('#word-cloud svg');

      // Convert SVGs to image URLs
      const [donutChartImage, topicChartImage, sentimentByTopicImage, wordCloudImage] = await Promise.all([
        svgToImage(donutChartSvg),
        svgToImage(topicChartSvg),
        svgToImage(sentimentByTopicSvg),
        svgToImage(wordCloudSvg)
      ]);
      
      // Apply styles
      const styles = `
        * { font-family: Arial, sans-serif; box-sizing: border-box; }
        body { max-width: 800px; margin: 0 auto; padding: 20px; }
        .report-header { text-align: center; margin-bottom: 30px; }
        .report-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .report-subtitle { font-size: 16px; margin-bottom: 15px; }
        .report-date { font-size: 12px; color: #777; }
        .report-section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .chart-container { 
          margin: 20px 0;
          text-align: center;
        }
        .chart-image {
          max-width: 100%;
          height: auto;
          margin: 10px 0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .suggestions-section { 
          background-color: #f0f7ff; 
          border-radius: 8px; 
          padding: 20px; 
          margin-top: 20px;
        }
        .print-button {
          background-color: #0d6efd;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 20px;
          display: block;
        }
        @media print {
          .print-button { display: none; }
          .chart-image { box-shadow: none; }
        }
      `;
      
      // Data preparation
      const sentimentData = filteredData.sentiment;
      const total = sentimentData.positive + sentimentData.negative + sentimentData.neutral;
      const positivePercent = total > 0 ? Math.round((sentimentData.positive / total) * 100) : 0;
      const negativePercent = total > 0 ? Math.round((sentimentData.negative / total) * 100) : 0;
      const neutralPercent = total > 0 ? Math.round((sentimentData.neutral / total) * 100) : 0;
      
      // Write the document content
      reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Course Feedback Analysis - ${courseName}</title>
          <style>${styles}</style>
        </head>
        <body>
          <button class="print-button" onclick="window.print(); return false;">Print or Save as PDF</button>
          
          <div class="report-header">
            <div class="report-title">Course Feedback Analysis</div>
            <div class="report-subtitle">${courseName || "Course"}</div>
            <div class="report-date">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
          
           <!-- Sentiment Overview Section -->
          <div class="report-section">
            <h2 class="section-title">Overall Sentiment</h2>
            <div class="chart-placeholder">
              <div style="font-weight: bold; margin-bottom: 15px;">Sentiment Distribution</div>
              <div style="display: flex; justify-content: space-around; max-width: 600px; margin: 0 auto;">
                <div>
                  <div style="font-size: 28px; font-weight: bold; color: #28a745;">${positivePercent}%</div>
                  <div>Positive</div>
                </div>
                <div>
                  <div style="font-size: 28px; font-weight: bold; color: #ffc107;">${neutralPercent}%</div>
                  <div>Neutral</div>
                </div>
                <div>
                  <div style="font-size: 28px; font-weight: bold; color: #dc3545;">${negativePercent}%</div>
                  <div>Negative</div>
                </div>
              </div>
            </div>
            <p class="chart-note">Note: Percentages based on ${total.toLocaleString()} analyzed responses</p>
          </div>
          
          <!-- Topic Distribution Section -->
          <div class="report-section">
            <h2 class="section-title">Topic Distribution</h2>
            <div class="chart-container">
              ${topicChartImage ? `
                <img src="${topicChartImage}" alt="Topic Distribution" class="chart-image">
              ` : `
                <div class="chart-placeholder">Chart not available</div>
              `}
            </div>
          </div>
          
          <!-- Sentiment by Topic Section -->
          <div class="report-section">
            <h2 class="section-title">Sentiment by Topic</h2>
            <div class="chart-container">
              ${sentimentByTopicImage ? `
                <img src="${sentimentByTopicImage}" alt="Sentiment by Topic" class="chart-image">
              ` : `
                <div class="chart-placeholder">Chart not available</div>
              `}
            </div>
          </div>
          
          <!-- Word Cloud Section -->
          <div class="report-section">
            <h2 class="section-title">Word Cloud</h2>
            <div class="chart-container">
              ${wordCloudImage ? `
                <img src="${wordCloudImage}" alt="Word Cloud" class="chart-image">
              ` : `
                <div class="chart-placeholder">Chart not available</div>
              `}
            </div>
          </div>
          
          <!-- Suggestions Section -->
          <div class="suggestions-section">
            <h2 class="section-title">Suggested Improvements</h2>
            <p>${suggestion || "No suggestions available"}</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; color: #6c757d; font-size: 12px;">
            <p>Report generated from ${rowCount.toLocaleString()} student feedback responses</p>
          </div>
        </body>
        </html>
      `);
      
      reportWindow.document.close();

      // Clean up object URLs
      setTimeout(() => {
        if (donutChartImage) URL.revokeObjectURL(donutChartImage);
        if (topicChartImage) URL.revokeObjectURL(topicChartImage);
        if (sentimentByTopicImage) URL.revokeObjectURL(sentimentByTopicImage);
        if (wordCloudImage) URL.revokeObjectURL(wordCloudImage);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate the report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Function to filter data based on selected topic and sentiment
  const filterData = (data, topic, sentiment) => {
    if (!data || Object.keys(data).length === 0) {
      return {
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        topics: {},
        sentiment_by_topic: {}
      };
    }

    if (topic === "all" && sentiment === "all") return data;

    let filteredData = { ...data };

    if (topic !== "all") {
      // Filter sentiment counts for specific topic
      const topicSentiments = data.sentiment_by_topic[topic] || {};
      filteredData.sentiment = {
        positive: topicSentiments["LABEL_2"] || 0,
        neutral: topicSentiments["LABEL_1"] || 0,
        negative: topicSentiments["LABEL_0"] || 0,
      };

      // Filter topics to show only selected topic
      filteredData.topics = {
        [topic]: data.topics[topic] || 0
      };
    }

    if (sentiment !== "all") {
      const sentimentMap = {
        "positive": "LABEL_2",
        "neutral": "LABEL_1",
        "negative": "LABEL_0"
      };

      // Filter topics by sentiment
      const filteredTopics = {};
      Object.entries(data.sentiment_by_topic || {}).forEach(([topic, sentiments]) => {
        if (sentiments[sentimentMap[sentiment]] > 0) {
          filteredTopics[topic] = sentiments[sentimentMap[sentiment]];
        }
      });

      if (topic === "all") {
        filteredData.topics = filteredTopics;
      }

      // Update sentiment counts to show only selected sentiment
      const sentimentLabel = sentimentMap[sentiment];
      let totalSentiment = 0;
      Object.values(data.sentiment_by_topic || {}).forEach(sentiments => {
        totalSentiment += sentiments[sentimentLabel] || 0;
      });

      filteredData.sentiment = {
        positive: sentiment === "positive" ? totalSentiment : 0,
        neutral: sentiment === "neutral" ? totalSentiment : 0,
        negative: sentiment === "negative" ? totalSentiment : 0,
      };
    }

    return filteredData;
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
          
          // Process feedback data
          const rawFeedbackData = csvResponse.data.feedbackData || [];
          console.log(`Received ${rawFeedbackData.length} feedback items`);
          
          // Make sure we have all required fields
          const processedFeedback = rawFeedbackData.map((item, index) => {
            return {
              id: item.id || index,
              feedback: item.feedback || item.text || "No feedback text", // Handle both formats
              sentiment: item.sentiment || "neutral",
              topic: item.topic || "General",
              source_column: item.source_column || "Unknown"
            };
          });
          
          setFeedbackData(processedFeedback);
          
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

  // Handle chart click events
  const handleTopicClick = (topic) => {
    setSelectedTopic(topic === selectedTopic ? "all" : topic);
  };

  const handleSentimentClick = (sentiment) => {
    setSelectedSentiment(sentiment === selectedSentiment ? "all" : sentiment);
  };

  // Filter feedback based on selected topic, sentiment, and column
  const filteredFeedback = feedbackData.filter(item => {
    // For column filtering, check both the source_column and if it ends with the selected column name
    const isOriginalColumn = selectedColumn ? 
      item.source_column === selectedColumn.replace('Sentiment_', '') : true;
    
    const isSelectedColumn = selectedColumn ? 
      (item.source_column === selectedColumn || 
       `Sentiment_${item.source_column}` === selectedColumn) : true;
    
    const columnMatch = !selectedColumn || isOriginalColumn || isSelectedColumn;
    
    // For topic and sentiment filtering
    const topicMatch = selectedTopic === "all" || item.topic === selectedTopic;
    const sentimentMatch = selectedSentiment === "all" || item.sentiment === selectedSentiment;
    
    return columnMatch && topicMatch && sentimentMatch;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFeedback.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);

  // Add debugging
  console.log(`Total feedback items: ${feedbackData.length}`);
  console.log(`Filtered feedback items: ${filteredFeedback.length}`);
  console.log(`Current page items: ${currentItems.length}`);
  console.log(`Selected column: ${selectedColumn}`);
  console.log(`Selected topic: ${selectedTopic}`);
  console.log(`Selected sentiment: ${selectedSentiment}`);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get sentiment badge color
  const getSentimentBadgeColor = (sentiment) => {
    switch(sentiment?.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'danger';
      case 'neutral': return 'warning';
      default: return 'secondary';
    }
  };

  // Function to combine sentiment data from all columns
  const getCombinedSentimentData = () => {
    if (!selectedColumn) {
      // Combine data from all columns
      const combined = {
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        topics: {},
        sentiment_by_topic: {}
      };

      Object.values(columnData).forEach(data => {
        // Combine sentiment counts
        combined.sentiment.positive += data.sentiment.positive;
        combined.sentiment.neutral += data.sentiment.neutral;
        combined.sentiment.negative += data.sentiment.negative;

        // Combine topic counts
        Object.entries(data.topics).forEach(([topic, count]) => {
          combined.topics[topic] = (combined.topics[topic] || 0) + count;
        });

        // Combine sentiment by topic
        Object.entries(data.sentiment_by_topic).forEach(([topic, sentiments]) => {
          if (!combined.sentiment_by_topic[topic]) {
            combined.sentiment_by_topic[topic] = {
              "LABEL_0": 0,
              "LABEL_1": 0,
              "LABEL_2": 0
            };
          }
          combined.sentiment_by_topic[topic]["LABEL_0"] += sentiments["LABEL_0"] || 0;
          combined.sentiment_by_topic[topic]["LABEL_1"] += sentiments["LABEL_1"] || 0;
          combined.sentiment_by_topic[topic]["LABEL_2"] += sentiments["LABEL_2"] || 0;
        });
      });

      return combined;
    }

    return columnData[selectedColumn] || {
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      topics: {},
      sentiment_by_topic: {}
    };
  };

  // Add scroll event listener for sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.sticky-top');
      if (header) {
        if (window.scrollY > 0) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  const currentData = getCombinedSentimentData();
  const filteredData = filterData(currentData, selectedTopic, selectedSentiment);
  
  return (
    <div className="min-vh-100 bg-light">
        {/* Sticky Header */}
        <div className="sticky-top bg-white shadow-sm">
            <div className="container-fluid px-4 py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <button 
                            className="btn btn-link text-dark p-0 d-flex align-items-center"
                            onClick={handleGoBack}
                        >
                            <i className="bi bi-arrow-left fs-4"></i>
                        </button>
                        <div>
                            <h6 className="text-muted mb-0">Analysis Results</h6>
                            <h4 className="mb-0 fw-bold">{courseName || "Loading..."}</h4>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <button 
                            className="btn btn-outline-primary export-btn"
                            onClick={handleExportReport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-download me-2"></i>
                                    Export Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Filter Bar */}
            <div className="container-fluid px-4 py-2 border-top">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        {/* Column Filter */}
                        {Object.keys(columnData).length > 1 && (
                            <div className="dropdown">
                                <button 
                                    className="btn btn-light dropdown-toggle d-flex align-items-center gap-2" 
                                    type="button" 
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bi bi-funnel"></i>
                                    {selectedColumn ? selectedColumn.replace('Sentiment_', '') : 'All Feedback'}
                                </button>
                                <ul className="dropdown-menu shadow-sm border-0">
                                    <li>
                                        <button 
                                            className="dropdown-item d-flex align-items-center gap-2" 
                                            onClick={() => {
                                                setSelectedColumn("");
                                                setSelectedTopic("all");
                                                setSelectedSentiment("all");
                                            }}
                                        >
                                            <i className="bi bi-check2 text-primary"></i>
                                            All Feedback
                                        </button>
                                    </li>
                                    {Object.keys(columnData).map(column => (
                                        <li key={column}>
                                            <button 
                                                className="dropdown-item d-flex align-items-center gap-2" 
                                                onClick={() => {
                                                    setSelectedColumn(column);
                                                    setSelectedTopic("all");
                                                    setSelectedSentiment("all");
                                                }}
                                            >
                                                {selectedColumn === column && (
                                                    <i className="bi bi-check2 text-primary"></i>
                                                )}
                                                {column.replace('Sentiment_', '')}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {/* Active Filters */}
                        <div className="d-flex gap-2">
                            {selectedTopic !== "all" && (
                                <span className="badge bg-primary bg-opacity-10 text-primary d-flex align-items-center p-2 px-3">
                                    <i className="bi bi-tag me-2"></i>
                                    {selectedTopic}
                                    <button 
                                        className="btn-close btn-close-primary ms-2" 
                                        onClick={() => setSelectedTopic("all")}
                                    ></button>
                                </span>
                            )}
                            {selectedSentiment !== "all" && (
                                <span className="badge bg-primary bg-opacity-10 text-primary d-flex align-items-center p-2 px-3">
                                    <i className="bi bi-emoji-smile me-2"></i>
                                    {selectedSentiment}
                                    <button 
                                        className="btn-close btn-close-primary ms-2" 
                                        onClick={() => setSelectedSentiment("all")}
                                    ></button>
                                </span>
                            )}
                        </div>
                    </div>
                    
                    
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="container-fluid px-4 py-4">
            {/* Charts and Feedback Section */}
            <div className="row g-4">
                {/* Charts Section */}
                <div className="col-lg-8">
                    <div className="row g-4">
                        {/* Topic Distribution */}
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 hover-lift h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="card-title mb-0">Topic Distribution</h5>
                                    </div>
                                    <div id="topic-chart">
                                        <TopicChart 
                                            topicCounts={filteredData.topics} 
                                            onTopicClick={handleTopicClick}
                                            selectedTopic={selectedTopic}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Sentiment by Topic */}
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 hover-lift h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="card-title mb-0">Sentiment by Topic</h5>
                                    </div>
                                    <div id="sentiment-by-topic-chart">
                                        <SentimentByTopicChart 
                                            sentimentByTopic={filteredData.sentiment_by_topic}
                                            onTopicClick={handleTopicClick}
                                            selectedTopic={selectedTopic}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Sentiment */}
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 hover-lift h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="card-title mb-0">Overall Sentiment</h5>
                                    </div>
                                    <div id="donut-chart">
                                        <DonutChart 
                                            sentimentCounts={filteredData.sentiment}
                                            onSentimentClick={handleSentimentClick}
                                            selectedSentiment={selectedSentiment}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Word Cloud */}
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 hover-lift h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="card-title mb-0">Word Cloud</h5>
                                    </div>
                                    <div id="word-cloud">
                                        <WordCloud 
                                            filePath={filePath} 
                                            columnName={selectedColumn}
                                            selectedTopic={selectedTopic}
                                            selectedSentiment={selectedSentiment}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Suggestions Card */}
                    <div className="card shadow-sm border-0 hover-lift mt-4">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                    <i className="bi bi-lightbulb text-primary fs-4"></i>
                                </div>
                                <div>
                                    <h5 className="card-title mb-1">Suggested Improvements</h5>
                                    <p className="text-muted mb-0">Based on analysis of {rowCount.toLocaleString()} responses</p>
                                </div>
                            </div>
                            <div className="alert alert-light border-0 mb-0">
                                <div className="d-flex">
                                    <div className="me-3">
                                        <i className="bi bi-info-circle-fill text-primary fs-5"></i>
                                    </div>
                                    <div>
                                        <p className="mb-0">{suggestion || "Loading suggestions..."}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feedback List Section */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 hover-lift sticky-top" style={{ top: '90px' }}>
                        <div className="card-header bg-white p-4 border-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-1">Feedback List</h5>
                                    <p className="text-muted small mb-0">{filteredFeedback.length} items found</p>
                                </div>
                                <div className="dropdown">
                                    <button className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                                        <i className="bi bi-sort-down"></i>
                                        Sort by
                                    </button>
                                    <ul className="dropdown-menu shadow-sm border-0">
                                        <li><button className="dropdown-item" onClick={() => {
                                            const sorted = [...feedbackData].sort((a, b) => {
                                                if (a.sentiment === b.sentiment) return 0;
                                                if (a.sentiment === 'positive') return -1;
                                                if (b.sentiment === 'positive') return 1;
                                                if (a.sentiment === 'neutral') return -1;
                                                return 1;
                                            });
                                            setFeedbackData(sorted);
                                        }}>Most Positive</button></li>
                                        <li><button className="dropdown-item" onClick={() => {
                                            const sorted = [...feedbackData].sort((a, b) => {
                                                if (a.sentiment === b.sentiment) return 0;
                                                if (a.sentiment === 'negative') return -1;
                                                if (b.sentiment === 'negative') return 1;
                                                if (a.sentiment === 'neutral') return -1;
                                                return 1;
                                            });
                                            setFeedbackData(sorted);
                                        }}>Most Negative</button></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                            <div className="list-group list-group-flush">
                                {currentItems.length > 0 ? (
                                    currentItems.map((item, index) => (
                                        <div key={item.id || index} className="list-group-item p-4 border-0 border-bottom">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex gap-2">
                                                    <span className={`badge bg-${getSentimentBadgeColor(item.sentiment)}-subtle text-${getSentimentBadgeColor(item.sentiment)} px-3 py-2`}>
                                                        <i className={`bi bi-emoji-${
                                                            item.sentiment === 'positive' ? 'smile' :
                                                            item.sentiment === 'negative' ? 'frown' : 'neutral'
                                                        } me-2`}></i>
                                                        {item.sentiment}
                                                    </span>
                                                    {item.topic && (
                                                        <span className="badge bg-primary-subtle text-primary px-3 py-2">
                                                            <i className="bi bi-tag me-2"></i>
                                                            {item.topic}
                                                        </span>
                                                    )}
                                                </div>
                                                <small className="text-muted">{item.source_column}</small>
                                            </div>
                                            <p className="mb-0 text-break">{item.feedback}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-5">
                                        <i className="bi bi-inbox-fill text-muted fs-1 mb-3"></i>
                                        <p className="text-muted mb-0">No feedback found with current filters</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {filteredFeedback.length > itemsPerPage && (
                            <div className="card-footer bg-white p-3 border-0">
                                <nav>
                                    <ul className="pagination mb-0 justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        
                                        {/* Logic to show only 3 page buttons */}
                                        {(() => {
                                            // Define which page numbers to show
                                            let startPage = Math.max(1, currentPage - 1);
                                            let endPage = Math.min(totalPages, startPage + 2);
                                            
                                            // Adjust if we're at the end
                                            if (endPage - startPage < 2 && startPage > 1) {
                                                startPage = Math.max(1, endPage - 2);
                                            }
                                            
                                            // Create array of pages to display
                                            const pages = [];
                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(i);
                                            }
                                            
                                            // Return the page buttons
                                            return pages.map(pageNum => (
                                                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => paginate(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </li>
                                            ));
                                        })()}
                                        
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <style>
            {`
                /* Card hover effects */
                .hover-lift {
                    transition: all 0.2s ease-in-out;
                }
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
                }

                /* Progress bar animations */
                .progress-bar {
                    transition: width 0.6s ease;
                }

                /* Badge hover effects */
                .badge {
                    transition: all 0.2s ease-in-out;
                }
                .badge:hover {
                    transform: scale(1.05);
                }

                /* List item hover effects */
                .list-group-item {
                    transition: all 0.2s ease-in-out;
                }
                .list-group-item:hover {
                    background-color: rgba(0, 0, 0, 0.01);
                }

                /* Button hover effects */
                .btn {
                    transition: all 0.2s ease-in-out;
                }
                .btn:hover {
                    transform: translateY(-1px);
                }

                /* Dropdown menu animations */
                .dropdown-menu {
                    animation: dropdownFade 0.2s ease-in-out;
                }
                @keyframes dropdownFade {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Sticky header shadow */
                .sticky-top {
                    transition: box-shadow 0.2s ease-in-out;
                }
                .sticky-top.scrolled {
                    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
                }

                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                ::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }

                /* Pagination styles */
                .pagination .page-link {
                    border-radius: 4px;
                    margin: 0 2px;
                    border: none;
                    color: #6c757d;
                    transition: all 0.2s ease-in-out;
                }
                .pagination .page-link:hover {
                    background-color: #e9ecef;
                    color: #000;
                    transform: translateY(-1px);
                }
                .pagination .page-item.active .page-link {
                    background-color: #0d6efd;
                    color: white;
                }

                /* Chart container styles */
                .chart-container {
                    position: relative;
                    transition: all 0.3s ease-in-out;
                }
                .chart-container:hover {
                    transform: scale(1.02);
                }

                /* Loading animation */
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
                .loading-pulse {
                    animation: pulse 1.5s infinite;
                }
            `}
        </style>
    </div>
  );
};

export default ResultPage;
