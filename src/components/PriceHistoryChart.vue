<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const props = defineProps({
  marketData: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const chartRef = ref(null);
const chartInstance = ref(null);

// Helper function to format dates as DD/MM/YY
const formatDate = (date) => {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}`;
};

  // This function processes all the market data for our chart
  // It basically takes all of our listings and organises them correctly
const processChartData = () => {
  // If there's no market data, just return empty arrays to avoid errors
  if (!props.marketData || !props.marketData.recentHistory) {
    return { labels: [], hqData: [], nqData: [], hqPrices: [], nqPrices: [] };
  }
  
  // Make a copy of the history data and sort it chronologically (oldest first)
  const sortedHistory = [...props.marketData.recentHistory].sort((a, b) => a.timestamp - b.timestamp);
  
  // Show the last 3 days of sales
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoTimestamp = Math.floor(threeDaysAgo.getTime() / 1000);
  
  // Cut off everything older than 3 days
  const filteredHistory = sortedHistory.filter(sale => sale.timestamp >= threeDaysAgoTimestamp);
  
  // Split the sales into HQ and NQ categories
  const hqSales = filteredHistory.filter(sale => sale.hq);
  const nqSales = filteredHistory.filter(sale => !sale.hq);
  
  // Create data points for the chart.js time scale
  const hqDataPoints = hqSales.map(sale => ({
    x: new Date(sale.timestamp * 1000),
    y: sale.pricePerUnit
  }));
  
  const nqDataPoints = nqSales.map(sale => ({
    x: new Date(sale.timestamp * 1000),
    y: sale.pricePerUnit
  }));
  
  // Create labels for each data point in DD/MM/YY format
  const labels = filteredHistory.map(sale => {
    const date = new Date(sale.timestamp * 1000);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  });
  
  // Extract just the price values for easier access
  const hqData = hqSales.map(sale => sale.pricePerUnit);
  const nqData = nqSales.map(sale => sale.pricePerUnit);
  
  // Return everything the chart needs
  return { 
    labels, 
    hqData, 
    nqData,
    hqDataPoints,
    nqDataPoints
  };
};

const setupChart = () => {
  if (!chartRef.value) return;
  
  const ctx = chartRef.value.getContext('2d');
  const chartData = processChartData();
  
  // Get rid of any old chart before making a new one
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
  
  // Create our new chart with all the right settings
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: '(HQ) PerUnit',
          data: chartData.hqDataPoints,
          borderColor: '#FFD700', // Gold color for HQ
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
          order: 1
        },
        {
          label: '(NQ) PerUnit',
          data: chartData.nqDataPoints,
          borderColor: '#808080', // Gray color for NQ
          backgroundColor: 'rgba(128, 128, 128, 0.1)',
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
          order: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
            color: 'rgba(70, 70, 70, 0.15)',
            drawBorder: false
          },
          ticks: {
            color: '#888',
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
            font: {
              size: 9
            }
          },
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'dd/MM/yy'
            }
          }
        },
        y: {
          display: true,
          grid: {
            color: 'rgba(70, 70, 70, 0.15)',
            drawBorder: false
          },
          ticks: {
            color: '#888',
            font: {
              size: 10
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            color: '#888'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          bodyFont: {
            size: 12
          },
          titleFont: {
            size: 11
          },
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString();
              }
              return label;
            }
          }
        },
        hover: {
          mode: 'nearest',
          intersect: false
        }
      }
    }
  });
};

// This watches for any changes to our market data
// When new data comes in, we redraw the chart automatically
watch(() => props.marketData, () => {
  if (!props.loading) {
    setupChart();
  }
}, { deep: true });

// When the component first appears on screen, we set up the chart
// But only if we're not still loading data
onMounted(() => {
  if (!props.loading) {
    setupChart();
  }
});
</script>

<template>
  <div class="chart-container">
    <h2>CROSS-WORLD PURCHASE HISTORY ({{ props.marketData?.recentHistory?.length || 0 }} SALES)</h2>
    
    <!-- Date range display -->
          <div class="date-range">
      {{ formatDate(new Date(new Date().setDate(new Date().getDate() - 3))) }} → {{ formatDate(new Date()) }}
    </div>
    
    <!-- Chart canvas -->
    <div class="chart-wrapper">
      <canvas ref="chartRef" height="300"></canvas>
      
      <!-- Loading overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
      
      <!-- No data message -->
      <div v-else-if="!props.marketData?.recentHistory?.length" class="no-data">
        No sales history available
      </div>
    </div>
    
    <!-- Chart legend -->
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-color" style="background-color: #FFD700;"></span>
        <span>(HQ) PerUnit</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background-color: #808080;"></span>
        <span>(NQ) PerUnit</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  margin: 2rem 0;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  color: #333;
}

h2 {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-transform: uppercase;
  color: #333;
}

.date-range {
  color: #6c757d;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  margin-bottom: 1rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid #007bff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #6c757d;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #6c757d;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 0.5rem;
  border-radius: 2px;
}
</style>