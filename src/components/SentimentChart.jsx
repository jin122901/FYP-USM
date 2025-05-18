import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DonutChart = ({ sentimentCounts, onSentimentClick, selectedSentiment }) => {
  const totalSentiments =
    sentimentCounts.negative + sentimentCounts.neutral + sentimentCounts.positive;

  const data = [
    {
      name: "Negative",
      value: (sentimentCounts.negative / totalSentiments) * 100,
      rawValue: sentimentCounts.negative,
      sentiment: "negative"
    },
    {
      name: "Neutral",
      value: (sentimentCounts.neutral / totalSentiments) * 100,
      rawValue: sentimentCounts.neutral,
      sentiment: "neutral"
    },
    {
      name: "Positive",
      value: (sentimentCounts.positive / totalSentiments) * 100,
      rawValue: sentimentCounts.positive,
      sentiment: "positive"
    },
  ];

  const COLORS = {
    Negative: "#dc3545",
    Neutral: "#ffc107",
    Positive: "#28a745"
  };

  const handleClick = (data) => {
    if (onSentimentClick && data.sentiment) {
      onSentimentClick(data.sentiment);
    }
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    payload,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    const isSelected = selectedSentiment === payload.sentiment;

    return (
      <text
        x={x}
        y={y}
        fill={isSelected ? "#fff" : "black"}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight="bold"
        style={{ 
          filter: isSelected ? 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' : 'none',
          cursor: 'pointer'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip bg-white p-2 border rounded shadow-sm">
          <p className="mb-0">
            <strong>{data.name}</strong>
          </p>
          <p className="mb-0">Count: {data.rawValue}</p>
          <p className="mb-0">Percentage: {data.value.toFixed(1)}%</p>
          <small className="text-muted">Click to filter</small>
        </div>
      );
    }
    return null;
  };

  const calculateOverallSentiment = () => {
    const score =
      (sentimentCounts.positive * 100 +
        sentimentCounts.neutral * 50 +
        sentimentCounts.negative * 0) /
      totalSentiments;

    if (score < 33.33) return { text: "Negative", emoji: "😞" };
    if (score < 66.67) return { text: "Neutral", emoji: "😐" };
    return { text: "Positive", emoji: "😊" };
  };

  const overallSentiment = calculateOverallSentiment();

  return (
    <div className="card shadow-sm p-3 h-90">
      <style>
        {`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .emoji-bounce {
            animation: bounce 2s infinite;
            display: inline-block;
          }
        `}
      </style>

      <h5 className="fw-bold text-center">Sentiment Breakdown</h5>

      <div className="d-flex align-items-center justify-content-center gap-5 mt-3">
        <div style={{ width: "60%", height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                fill="#8884d8"
                labelLine={false}
                label={renderCustomizedLabel}
                onClick={handleClick}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name]}
                    style={{
                      filter: selectedSentiment === entry.sentiment ? 'brightness(1.2)' : 'none',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value, entry) => (
                  <span style={{ 
                    color: selectedSentiment === entry.payload.sentiment ? COLORS[value] : '#666',
                    fontWeight: selectedSentiment === entry.payload.sentiment ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}>
                    {value}
                  </span>
                )}
                onClick={(data) => handleClick(data.payload)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="text-center">
          <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
            Overall Sentiment
          </div>
          <div className="emoji-bounce" style={{ fontSize: "60px", lineHeight: 1 }}>
            {overallSentiment.emoji}
          </div>
          <div className="mt-2" style={{ fontSize: "20px", fontWeight: "bold" }}>
            {overallSentiment.text}
          </div>
        </div>
      </div>

      {selectedSentiment === "all" && (
        <div className="mt-2 text-muted text-center">
          <small>Click on a segment to filter the data</small>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
