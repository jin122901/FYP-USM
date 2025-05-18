import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const TopicBarChart = ({ topicCounts, onTopicClick, selectedTopic }) => {
  // Convert topicCounts object into an array for Recharts
  const data = Object.entries(topicCounts).map(([topic, count], index) => ({
    name: topic,
    value: count,
    color: selectedTopic === topic ? "#ff4d4d" : ["#ff8c66", "#66d9ff", "#6666ff", "#ff66ff", "#8cff66"][index % 6],
  }));

  const handleClick = (data) => {
    if (onTopicClick && data.name) {
      onTopicClick(data.name);
    }
  };

  return (
    <div className="card shadow-sm p-3 text-center">
      <h5 className="fw-bold">Topic Breakdown</h5>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          layout="vertical" 
          data={data} 
          margin={{ top: 20, right: 20, bottom: 15, left: 40 }}
          onClick={(e) => e && e.activePayload && handleClick(e.activePayload[0].payload)}
        >
          {/* Y Axis - Represents the topics */}
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150} 
            tick={{ 
              fontSize: 12,
              fill: (value) => selectedTopic === value ? "#ff4d4d" : "#000"
            }} 
          />
          
          {/* X Axis - Represents the values */}
          <XAxis type="number" tick={{ fontSize: 12 }} />
          
          {/* Tooltip to show value when hovering over a bar */}
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="custom-tooltip bg-white p-2 border rounded shadow-sm">
                    <p className="mb-0">
                      <strong>{payload[0].payload.name}</strong>
                    </p>
                    <p className="mb-0">Count: {payload[0].value}</p>
                    <small className="text-muted">Click to filter</small>
                  </div>
                );
              }
              return null;
            }}
          />
          
          {/* Bar elements */}
          <Bar 
            dataKey="value" 
            barSize={30}
            cursor="pointer"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{
                  filter: selectedTopic === entry.name ? 'brightness(1.2)' : 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {selectedTopic === "all" && (
        <div className="mt-2 text-muted">
          <small>Click on a topic to filter the data</small>
        </div>
      )}
    </div>
  );
};

export default TopicBarChart;
