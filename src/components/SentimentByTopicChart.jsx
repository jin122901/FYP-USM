import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

const SentimentByTopicChart = ({ sentimentByTopic, onTopicClick, selectedTopic }) => {
  // Process sentimentByTopic into an array suitable for Recharts
  const data = Object.entries(sentimentByTopic || {}).map(([topic, sentiments]) => {
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

  const handleClick = (e) => {
    if (e && e.activePayload && e.activePayload[0]?.payload?.name && onTopicClick) {
      onTopicClick(e.activePayload[0].payload.name);
    }
  };

  const renderCustomizedLabel = (props) => {
    if (!props || !props.value) return null;
    const { x, y, width, height, value, name } = props;
    if (width < 30) return null; // Don't render small labels
    const isSelected = selectedTopic === name;

    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill={isSelected ? "#fff" : "#000"} 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize={12}
        fontWeight="bold"
        style={{
          filter: isSelected ? 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' : 'none'
        }}
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
          onClick={handleClick}
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
            tick={{ 
              fontSize: 12,
              fill: (value) => selectedTopic === value ? "#ff4d4d" : "#000"
            }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length || !payload[0]?.payload) {
                return null;
              }

              try {
                const total = payload[0].payload.total;
                return (
                  <div className="custom-tooltip bg-white p-2 border rounded shadow-sm">
                    <p className="mb-0"><strong>{label}</strong></p>
                    {payload.map((entry) => {
                      if (!entry || !entry.dataKey) return null;
                      return (
                        <p key={entry.dataKey} className="mb-0" style={{ color: entry.color }}>
                          {entry.name}: {entry.value?.toFixed(1)}% ({entry.payload[entry.dataKey]})
                        </p>
                      );
                    })}
                    <p className="mb-0">Total: {total}</p>
                    <small className="text-muted">Click to filter</small>
                  </div>
                );
              } catch (error) {
                console.error('Error rendering tooltip:', error);
                return null;
              }
            }}
          />
          
          <Bar 
            dataKey="positive" 
            stackId="a" 
            fill="#28a745"
            style={{ cursor: 'pointer' }}
          >
            <LabelList 
              dataKey="positive" 
              content={(props) => renderCustomizedLabel({ ...props, name: props?.payload?.name })} 
            />
          </Bar>
          <Bar 
            dataKey="neutral" 
            stackId="a" 
            fill="#ffc107"
            style={{ cursor: 'pointer' }}
          >
            <LabelList 
              dataKey="neutral" 
              content={(props) => renderCustomizedLabel({ ...props, name: props?.payload?.name })} 
            />
          </Bar>
          <Bar 
            dataKey="negative" 
            stackId="a" 
            fill="#dc3545"
            style={{ cursor: 'pointer' }}
          >
            <LabelList 
              dataKey="negative" 
              content={(props) => renderCustomizedLabel({ ...props, name: props?.payload?.name })} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {selectedTopic === "all" && (
        <div className="mt-2 text-muted">
          <small>Click on a bar to filter the data</small>
        </div>
      )}
    </div>
  );
};

export default SentimentByTopicChart;