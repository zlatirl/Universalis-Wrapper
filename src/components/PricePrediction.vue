<script setup>
import { ref, onMounted, watch } from 'vue';
import regression from 'regression';

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

// Reactive variables for regression
const regressionResults = ref(null);
const predictedPrices = ref([]);
const predictionDays = ref(7); // Predict prices for the next 7 days

// Watch for changes in market data to update regression analysis
watch(() => props.marketData, (newData) => {
  if (newData && newData.recentHistory && newData.recentHistory.length > 0) {
    performRegressionAnalysis();
  }
}, { deep: true });

// Perform regression analysis when component is mounted
onMounted(() => {
  if (props.marketData && props.marketData.recentHistory && props.marketData.recentHistory.length > 0) {
    performRegressionAnalysis();
  }
});

// Function to perform regression analysis on price history
const performRegressionAnalysis = () => {
  if (!props.marketData.recentHistory || props.marketData.recentHistory.length < 3) {
    console.log("Not enough data points for regression analysis");
    return;
  }

  try {
    // Extract timestamp and price data
    const dataPoints = props.marketData.recentHistory
      .map(sale => {
        // Convert timestamp to days since first sale for better regression
        return [sale.timestamp, sale.pricePerUnit];
      })
      .sort((a, b) => a[0] - b[0]); // Sort by timestamp

    // Normalize timestamps to days since first sale
    const firstTimestamp = dataPoints[0][0];
    const normalizedData = dataPoints.map(point => 
      [Math.floor((point[0] - firstTimestamp) / (60 * 60 * 24)), point[1]]
    );

    // Perform linear regression
    const result = regression.linear(normalizedData);
    regressionResults.value = result;
    
    // Generate predictions for future days
    const lastDay = normalizedData[normalizedData.length - 1][0];
    predictedPrices.value = [];
    
    for (let i = 1; i <= predictionDays.value; i++) {
      const predictedDay = lastDay + i;
      const predictedPrice = result.predict(predictedDay)[1];
      predictedPrices.value.push({
        day: predictedDay,
        price: predictedPrice,
        date: new Date((firstTimestamp + (predictedDay * 24 * 60 * 60)) * 1000)
      });
    }
  } catch (error) {
    console.error("Error in regression analysis:", error);
  }
};
</script>

<template>
  <div class="price-analysis-container">
    <h2>Price Analysis & Prediction</h2>
    
    <div v-if="loading" class="loading-indicator">
      Loading price data...
    </div>
    
    <template v-else>
      <!-- Historical data summary -->
      <div v-if="props.marketData.recentHistory && props.marketData.recentHistory.length > 0" class="historical-data">
        <h3>Historical Data Summary</h3>
        <p><strong>Data points:</strong> {{ props.marketData.recentHistory.length }}</p>
        <p><strong>Date range:</strong> 
          {{ new Date(props.marketData.recentHistory[0].timestamp * 1000).toLocaleDateString() }} to 
          {{ new Date(props.marketData.recentHistory[props.marketData.recentHistory.length - 1].timestamp * 1000).toLocaleDateString() }}
        </p>
        <p><strong>Price range:</strong>
          {{ Math.min(...props.marketData.recentHistory.map(item => item.pricePerUnit)).toFixed(0) }} to 
          {{ Math.max(...props.marketData.recentHistory.map(item => item.pricePerUnit)).toFixed(0) }} Gil
        </p>
      </div>
      
      <!-- Regression results summary -->
      <div v-if="regressionResults" class="regression-summary">
        <h4>Price Predictions</h4>
        
        <div v-if="predictedPrices.length > 0" class="predictions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Predicted Price (Gil)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prediction, index) in predictedPrices" :key="index">
                <td>{{ prediction.date.toLocaleDateString() }}</td>
                <td>{{ Math.round(prediction.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
    /* Styles for the analysis section */
    .price-analysis-container {
    margin-top: 2rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #eee;
    }

    .loading-indicator {
    text-align: center;
    padding: 2rem;
    color: #666;
    }

    .historical-data,
    .regression-summary {
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #eee;
    margin-bottom: 1.5rem;
    }

    .predictions-table {
    margin-top: 1rem;
    }

    .predictions-table table {
    width: 100%;
    border-collapse: collapse;
    }

    .predictions-table th,
    .predictions-table td {
    border: 1px solid #eee;
    padding: 0.5rem;
    text-align: left;
    }

    .predictions-table th {
    background-color: #f5f5f5;
    }
</style>