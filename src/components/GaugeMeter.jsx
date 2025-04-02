import React from "react";
import { PieChart, Pie, Cell, Sector } from "recharts";

const COLORS = ["#dc3545", "#ffc107", "#28a745"]; // Red, Yellow, Green

const GaugeMeter = ({ sentimentCounts }) => {
  const total = sentimentCounts.negative + sentimentCounts.neutral + sentimentCounts.positive;

  if (total === 0) return <p className="text-center">No sentiment data available</p>;

  const averageSentiment =
    (sentimentCounts.negative * -1 + sentimentCounts.neutral * 0 + sentimentCounts.positive * 1) / total;

  const averagePercentage = ((averageSentiment + 1) / 2) * 100;  // Convert average to percentage between 0 and 100

  const sentimentData = [
    { name: "Negative", value: (sentimentCounts.negative / total) * 100 },
    { name: "Neutral", value: (sentimentCounts.neutral / total) * 100 },
    { name: "Positive", value: (sentimentCounts.positive / total) * 100 },
  ];

  // To calculate the rotation of the pointer (Arrow) based on averagePercentage
  const pointerAngle = (averagePercentage / 100) * 180; // Convert percentage to angle (0 - 180 degrees)

  // Function to create a pointer
  const renderPointer = (cx, cy, radius, angle) => {
    const radian = (angle * Math.PI) / 180;
    const x = cx + radius * Math.cos(radian);
    const y = cy + radius * Math.sin(radian);

    return (
      <line
        x1={cx}
        y1={cy}
        x2={x}
        y2={y}
        stroke="black"
        strokeWidth="2"
        markerEnd="url(#arrowhead)" // Optional: Add arrowhead
      />
    );
  };

  return (
    <div className="text-center">
      <h5>Sentiment Analysis Gauge</h5>
      <p>Average Sentiment: {averageSentiment.toFixed(2)} (on a scale of -1 to 1)</p>
      <p>Average Sentiment Percentage: {averagePercentage.toFixed(2)}%</p>

      {/* Pie chart for sentiment distribution */}
      <PieChart width={400} height={250}>
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            orient="auto"
            markerWidth="4"
            markerHeight="4"
          >
            <path d="M0,0 L10,5 L0,10" fill="black" />
          </marker>
        </defs>
        
        {/* Pie chart */}
        <Pie
          data={sentimentData}
          cx={200}
          cy={150}
          startAngle={180}
          endAngle={0}
          innerRadius={70}
          outerRadius={100}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {sentimentData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>

        {/* Render the pointer based on average percentage */}
        {renderPointer(200, 150, 70, pointerAngle)}
      </PieChart>
    </div>
  );
};

export default GaugeMeter;
