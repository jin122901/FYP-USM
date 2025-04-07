import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

const SentimentByTopicChart = ({ sentimentByTopic }) => {
  // Process sentimentByTopic into an array suitable for Recharts
  const data = Object.entries(sentimentByTopic).map(([topic, sentiments]) => {
    const positive = sentiments["LABEL_2"] || 0;
    const neutral = sentiments["LABEL_1"] || 0;
    const negative = sentiments["LABEL_0"] || 0;
    const total = positive + neutral + negative;
    
    return {
      name: topic,
      positive,
      neutral,
      negative,
      total
    };
  });

  const renderCustomizedLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (width < 30) return null; // Don't render small labels
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="card shadow-sm p-3 text-center">
        <h5 className="fw-bold">Sentiment by Topic</h5>
      
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          barSize={20}
          stackOffset="expand"
        >
          <XAxis 
            type="number" 
            tickFormatter={(value) => `${Math.round(value * 100)}%`}
            domain={[0, 1]}
            tickCount={6}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value, name) => {
              const percentage = Math.round((value / data.find(item => item[name] === value).total) * 100);
              return [`${value} (${percentage}%)`, name];
            }}
            labelFormatter={(label) => `Topic: ${label}`}
          />
          
          <Bar dataKey="positive" stackId="a" fill="#28a745">
            <LabelList dataKey="positive" content={renderCustomizedLabel} />
          </Bar>
          <Bar dataKey="neutral" stackId="a" fill="#ffc107">
            <LabelList dataKey="neutral" content={renderCustomizedLabel} />
          </Bar>
          <Bar dataKey="negative" stackId="a" fill="#dc3545">
            <LabelList dataKey="negative" content={renderCustomizedLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      
    </div>
  );
};

export default SentimentByTopicChart;