import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const TopicBarChart = ({ topicCounts }) => {
  // Convert topicCounts object into an array for Recharts
  const data = Object.entries(topicCounts).map(([topic, count], index) => ({
    name: topic,
    value: count,
    color: ["#ff8c66", "#66d9ff", "#6666ff", "#ff66ff", "#8cff66"][index % 6], // Assign colors dynamically
  }));

  return (
    <div className="card shadow-sm p-3 text-center ">
      <h5 className="fw-bold">Topic Breakdown</h5>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart layout="vertical" data={data} margin={{ top: 20, right: 20, bottom: 15, left: 40 }}>
          {/* Y Axis - Represents the topics */}
          <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
          
          {/* X Axis - Represents the values */}
          <XAxis type="number" tick={{ fontSize: 12 }} />
          
          {/* Tooltip to show value when hovering over a bar */}
          <Tooltip />
          
          {/* Legend */}
          {/* <Legend /> */}
          
          {/* Bar elements */}
          <Bar dataKey="value" barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopicBarChart;
