import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DonutChart = ({ sentimentCounts }) => {
  const totalSentiments =
    sentimentCounts.negative + sentimentCounts.neutral + sentimentCounts.positive;

  const data = [
    {
      name: "Negative",
      value: (sentimentCounts.negative / totalSentiments) * 100,
    },
    {
      name: "Neutral",
      value: (sentimentCounts.neutral / totalSentiments) * 100,
    },
    {
      name: "Positive",
      value: (sentimentCounts.positive / totalSentiments) * 100,
    },
  ];

  const COLORS = ["#dc3545", "#ffc107", "#28a745"];

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="black"
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "#fff",
            padding: "5px 10px",
            border: "1px solid #ccc",
          }}
        >
          <p className="label">{`${payload[0].name}: ${payload[0].value.toFixed(1)}%`}</p>
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
    <div className="card shadow-sm p-3">
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
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
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
    </div>
  );
};

export default DonutChart;
