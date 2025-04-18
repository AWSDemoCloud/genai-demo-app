/**
 * Data Visualization Engine
 * 
 * Generates visual representations of user data and activity patterns.
 * Supports multiple chart types and customization options.
 */

class DataVisualizer {
  constructor(options = {}) {
    this.config = {
      defaultWidth: 800,
      defaultHeight: 600,
      defaultColorScheme: 'viridis',
      responsiveDesign: true,
      highDpiSupport: true,
      ...options
    };
    
    this.colorSchemes = {
      viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
      plasma: ['#0d0887', '#5302a3', '#8b0aa5', '#b83289', '#db5c68', '#f48849', '#febc2a'],
      inferno: ['#000004', '#320a5e', '#781c6d', '#bc3754', '#ed6925', '#fbb61a', '#fcffa4'],
      magma: ['#000004', '#2c115f', '#721f81', '#b73779', '#f0605d', '#feae76', '#fbfcbf'],
      blues: ['#f7fbff', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#034e7b'],
      reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d']
    };
    
    console.log('Data Visualization engine initialized with configuration:', this.config);
  }
  
  /**
   * Generate charts based on activity data
   * 
   * @param {Object} params - Chart generation parameters
   * @param {Array} params.activityData - Activity data to visualize
   * @param {Array} params.chartTypes - Types of charts to generate
   * @param {String} params.colorScheme - Color scheme to use
   * @param {Object} params.dimensions - Chart dimensions
   * @returns {Object} Generated chart data and metadata
   */
  generateCharts(params) {
    const { 
      activityData, 
      chartTypes = ['timeline', 'heatmap'], 
      colorScheme = this.config.defaultColorScheme,
      dimensions = { 
        width: this.config.defaultWidth, 
        height: this.config.defaultHeight 
      }
    } = params;
    
    // Validate input data
    if (!activityData || !Array.isArray(activityData) || activityData.length === 0) {
      throw new Error('Valid activity data is required for visualization');
    }
    
    // Prepare color palette
    const colors = this.colorSchemes[colorScheme] || this.colorSchemes.viridis;
    
    // Generate requested chart types
    const charts = {};
    
    chartTypes.forEach(chartType => {
      switch (chartType.toLowerCase()) {
        case 'timeline':
          charts.timeline = this._generateTimelineChart(activityData, colors, dimensions);
          break;
        case 'heatmap':
          charts.heatmap = this._generateHeatmapChart(activityData, colors, dimensions);
          break;
        case 'radar':
          charts.radar = this._generateRadarChart(activityData, colors, dimensions);
          break;
        case 'pie':
          charts.pie = this._generatePieChart(activityData, colors, dimensions);
          break;
        case 'bar':
          charts.bar = this._generateBarChart(activityData, colors, dimensions);
          break;
        default:
          console.warn(`Unsupported chart type: ${chartType}`);
      }
    });
    
    return {
      charts,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataPoints: activityData.length,
        colorScheme,
        dimensions
      }
    };
  }
  
  /**
   * Generate timeline chart data
   * @private
   */
  _generateTimelineChart(activityData, colors, dimensions) {
    // In a real implementation, this would generate actual chart data
    // For demo purposes, we'll create a simulated chart structure
    
    // Extract activity types and timestamps
    const activityTypes = new Set();
    activityData.forEach(activity => {
      const type = typeof activity === 'string' ? activity : activity.type;
      activityTypes.add(type);
    });
    
    // Create timeline data structure
    const timelineData = {
      type: 'timeline',
      title: 'User Activity Timeline',
      dimensions,
      series: Array.from(activityTypes).map((type, index) => {
        // Create data points for this activity type
        const dataPoints = activityData
          .filter(activity => {
            const actType = typeof activity === 'string' ? activity : activity.type;
            return actType === type;
          })
          .map((activity, i) => {
            // Generate timestamps (in a real app, these would come from actual data)
            const timestamp = new Date();
            timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 72));
            
            return {
              x: timestamp.toISOString(),
              y: 1,
              details: typeof activity === 'object' ? activity : { type }
            };
          });
        
        return {
          name: type,
          color: colors[index % colors.length],
          data: dataPoints
        };
      }),
      xAxis: {
        title: 'Time',
        type: 'datetime'
      },
      yAxis: {
        title: 'Activity',
        type: 'category'
      }
    };
    
    return timelineData;
  }
  
  /**
   * Generate heatmap chart data
   * @private
   */
  _generateHeatmapChart(activityData, colors, dimensions) {
    // In a real implementation, this would generate actual chart data
    // For demo purposes, we'll create a simulated heatmap structure
    
    // Create a 7x24 grid for days of week x hours of day
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);
    
    // Initialize heatmap data
    const heatmapData = daysOfWeek.map(day => {
      return hoursOfDay.map(hour => {
        // In a real implementation, this would count actual activities
        // For demo purposes, we'll generate random values weighted by time of day
        let value = Math.floor(Math.random() * 10);
        
        // Weight business hours higher
        if (hour >= 9 && hour <= 17) {
          value += Math.floor(Math.random() * 15);
        }
        
        // Weight weekdays higher than weekends
        if (day !== 'Saturday' && day !== 'Sunday') {
          value += Math.floor(Math.random() * 10);
        }
        
        return {
          day,
          hour,
          value
        };
      });
    }).flat();
    
    return {
      type: 'heatmap',
      title: 'Activity Frequency by Day and Hour',
      dimensions,
      data: heatmapData,
      xAxis: {
        categories: hoursOfDay.map(h => `${h}:00`),
        title: 'Hour of Day'
      },
      yAxis: {
        categories: daysOfWeek,
        title: 'Day of Week'
      },
      colorScale: {
        min: 0,
        max: Math.max(...heatmapData.map(d => d.value)),
        colors
      }
    };
  }
  
  /**
   * Generate radar chart data
   * @private
   */
  _generateRadarChart(activityData, colors, dimensions) {
    // Extract activity types
    const activityTypes = new Set();
    activityData.forEach(activity => {
      const type = typeof activity === 'string' ? activity : activity.type;
      activityTypes.add(type);
    });
    
    // Count occurrences of each activity type
    const activityCounts = {};
    activityData.forEach(activity => {
      const type = typeof activity === 'string' ? activity : activity.type;
      activityCounts[type] = (activityCounts[type] || 0) + 1;
    });
    
    // Create radar chart data
    return {
      type: 'radar',
      title: 'Activity Distribution',
      dimensions,
      series: [{
        name: 'Activity Frequency',
        data: Object.entries(activityCounts).map(([type, count]) => ({
          axis: type,
          value: count
        })),
        color: colors[0]
      }],
      axes: Object.keys(activityCounts).map(type => ({
        name: type,
        max: Math.max(...Object.values(activityCounts)) * 1.2
      }))
    };
  }
  
  /**
   * Generate pie chart data
   * @private
   */
  _generatePieChart(activityData, colors, dimensions) {
    // Count occurrences of each activity type
    const activityCounts = {};
    activityData.forEach(activity => {
      const type = typeof activity === 'string' ? activity : activity.type;
      activityCounts[type] = (activityCounts[type] || 0) + 1;
    });
    
    // Create pie chart data
    return {
      type: 'pie',
      title: 'Activity Distribution',
      dimensions,
      data: Object.entries(activityCounts).map(([type, count], index) => ({
        name: type,
        value: count,
        color: colors[index % colors.length]
      })),
      total: activityData.length
    };
  }
  
  /**
   * Generate bar chart data
   * @private
   */
  _generateBarChart(activityData, colors, dimensions) {
    // Count occurrences of each activity type
    const activityCounts = {};
    activityData.forEach(activity => {
      const type = typeof activity === 'string' ? activity : activity.type;
      activityCounts[type] = (activityCounts[type] || 0) + 1;
    });
    
    // Sort by count
    const sortedActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count], index) => ({
        name: type,
        value: count,
        color: colors[index % colors.length]
      }));
    
    // Create bar chart data
    return {
      type: 'bar',
      title: 'Activity Frequency',
      dimensions,
      data: sortedActivities,
      xAxis: {
        title: 'Activity Type',
        categories: sortedActivities.map(a => a.name)
      },
      yAxis: {
        title: 'Frequency',
        min: 0,
        max: Math.max(...sortedActivities.map(a => a.value)) * 1.2
      }
    };
  }
  
  /**
   * Export chart data to specified format
   * 
   * @param {Object} chartData - Chart data to export
   * @param {String} format - Export format (json, svg, png)
   * @returns {String|Buffer} Exported chart data
   */
  exportChart(chartData, format = 'json') {
    // In a real implementation, this would generate actual exports
    // For demo purposes, we'll just return the JSON data
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(chartData, null, 2);
      case 'svg':
        return `<svg><!-- SVG representation of ${chartData.type} chart would be here --></svg>`;
      case 'png':
        return Buffer.from('PNG representation would be here');
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

module.exports = DataVisualizer;
