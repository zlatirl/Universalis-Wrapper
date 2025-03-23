<script setup>
import { ref, onMounted, watch, computed } from 'vue';
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
const predictionQuality = ref('unknown'); // 'low', 'medium', 'high', 'unknown'
const priceVariationPercent = ref(0);
const timeSpanDays = ref(0);
const trendDirection = ref('stable'); // 'up', 'down', 'stable'
const slope = ref(0);

// Computed properties for data analysis
const dataPoints = computed(() => {
  if (!props.marketData.recentHistory || props.marketData.recentHistory.length === 0) return [];
  return props.marketData.recentHistory.length;
});

const priceRange = computed(() => {
  if (!props.marketData.recentHistory || props.marketData.recentHistory.length === 0) return { min: 0, max: 0 };
  
  const prices = props.marketData.recentHistory.map(item => item.pricePerUnit);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
});

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

// Function to assess prediction quality based on available data
const assessPredictionQuality = (dataPoints, timeSpan, priceVariation) => {
  // Insufficient data points
  if (dataPoints < 5) return 'low';
  
  // Very limited time span (less than 2 days)
  if (timeSpan < 2) return 'low';
  
  // Very little price variation (less than 2%)
  if (priceVariation < 2) return 'low';
  
  // Decent amount of data
  if (dataPoints >= 10 && timeSpan >= 7 && priceVariation >= 5) return 'high';
  
  // Medium quality for everything else
  return 'medium';
};

// Function to perform regression analysis on price history
const performRegressionAnalysis = () => {
  if (!props.marketData.recentHistory || props.marketData.recentHistory.length < 3) {
    console.log("Not enough data points for regression analysis");
    predictionQuality.value = 'low';
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
    const lastTimestamp = dataPoints[dataPoints.length - 1][0];
    
    // Calculate time span in days
    timeSpanDays.value = Math.ceil((lastTimestamp - firstTimestamp) / (60 * 60 * 24));
    
    const normalizedData = dataPoints.map(point => 
      [Math.floor((point[0] - firstTimestamp) / (60 * 60 * 24)), point[1]]
    );

    // Calculate price variation percentage
    const prices = dataPoints.map(point => point[1]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    priceVariationPercent.value = minPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0;

    // Assess prediction quality
    predictionQuality.value = assessPredictionQuality(
      dataPoints.length,
      timeSpanDays.value,
      priceVariationPercent.value
    );

    // Perform linear regression
    const result = regression.linear(normalizedData);
    regressionResults.value = result;
    
    // Get slope for trend direction
    slope.value = result.equation[0];
    
    // Determine trend direction based on slope
    if (Math.abs(slope.value) < 0.1) {
      trendDirection.value = 'stable';
    } else if (slope.value > 0) {
      trendDirection.value = 'up';
    } else {
      trendDirection.value = 'down';
    }
    
    // Generate predictions for future days
    const lastDay = normalizedData[normalizedData.length - 1][0];
    predictedPrices.value = [];
    
    for (let i = 1; i <= predictionDays.value; i++) {
      const predictedDay = lastDay + i;
      const predictedPrice = result.predict(predictedDay)[1];
      
      // Ensure the predicted price is reasonable (not negative)
      const safePredictedPrice = Math.max(0, predictedPrice);
      
      predictedPrices.value.push({
        day: predictedDay,
        price: safePredictedPrice,
        date: new Date((firstTimestamp + (predictedDay * 24 * 60 * 60)) * 1000)
      });
    }
  } catch (error) {
    console.error("Error in regression analysis:", error);
    predictionQuality.value = 'unknown';
  }
};

// Helper function to get confidence indicator class
const getConfidenceClass = (quality) => {
  switch (quality) {
    case 'high': return 'confidence-high';
    case 'medium': return 'confidence-medium';
    case 'low': return 'confidence-low';
    default: return 'confidence-unknown';
  }
};

// Function to get trend icon and class
const getTrendInfo = (direction) => {
  switch (direction) {
    case 'up': 
      return { icon: '↑', class: 'trend-up', text: 'Rising' };
    case 'down': 
      return { icon: '↓', class: 'trend-down', text: 'Falling' };
    default: 
      return { icon: '→', class: 'trend-stable', text: 'Stable' };
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
        <h3>Price Predictions</h3>
        
        <!-- Prediction quality indicator -->
        <div class="prediction-metadata">
          <div class="prediction-quality" :class="getConfidenceClass(predictionQuality)">
            <span class="quality-label">Prediction confidence:</span>
            <span class="quality-value">{{ predictionQuality === 'low' ? 'Low' : predictionQuality === 'medium' ? 'Medium' : 'High' }}</span>
          </div>
          
          <div class="price-trend" :class="getTrendInfo(trendDirection).class">
            <span class="trend-label">Price trend:</span>
            <span class="trend-value">{{ getTrendInfo(trendDirection).text }} {{ getTrendInfo(trendDirection).icon }}</span>
          </div>
        </div>
        
        <!-- Warning for low-confidence predictions -->
        <div v-if="predictionQuality === 'low'" class="prediction-warning">
          <p>
            <strong>Note:</strong> These predictions are based on limited data 
            {{ timeSpanDays < 2 ? '(short time period)' : '' }}
            {{ priceVariationPercent < 2 ? '(minimal price variation)' : '' }}
            {{ dataPoints < 5 ? '(few data points)' : '' }}
            and should be used with caution.
          </p>
        </div>
        
        <div v-if="predictedPrices.length > 0" class="predictions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Predicted Price (Gil)</th>
                <th v-if="predictionQuality !== 'low'">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prediction, index) in predictedPrices" :key="index">
                <td>{{ prediction.date.toLocaleDateString() }}</td>
                <td>{{ Math.round(prediction.price) }}</td>
                <td v-if="predictionQuality !== 'low' && index > 0">
                  <span :class="predictedPrices[index].price > predictedPrices[index-1].price ? 'price-up' : predictedPrices[index].price < predictedPrices[index-1].price ? 'price-down' : 'price-stable'">
                    {{ predictedPrices[index].price === predictedPrices[index-1].price ? '0' : (predictedPrices[index].price - predictedPrices[index-1].price).toFixed(1) }}
                    {{ predictedPrices[index].price > predictedPrices[index-1].price ? '↑' : predictedPrices[index].price < predictedPrices[index-1].price ? '↓' : '' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Show message if no predictions available -->
      <div v-if="!regressionResults && props.marketData.recentHistory && props.marketData.recentHistory.length > 0" class="no-predictions">
        <p>Not enough data available for price predictions. More price history is needed.</p>
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

.prediction-metadata {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  flex-wrap: wrap;
  gap: 1rem;
}

.prediction-quality, .price-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.quality-label, .trend-label {
  font-weight: bold;
}

.confidence-high {
  background-color: #d4edda;
  color: #155724;
}

.confidence-medium {
  background-color: #fff3cd;
  color: #856404;
}

.confidence-low {
  background-color: #f8d7da;
  color: #721c24;
}

.confidence-unknown {
  background-color: #e2e3e5;
  color: #383d41;
}

.trend-up {
  background-color: #d4edda;
  color: #155724;
}

.trend-down {
  background-color: #f8d7da;
  color: #721c24;
}

.trend-stable {
  background-color: #e2e3e5;
  color: #383d41;
}

.price-up {
  color: #28a745;
}

.price-down {
  color: #dc3545;
}

.price-stable {
  color: #6c757d;
}

.prediction-warning {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.prediction-warning p {
  margin: 0;
}

.no-predictions {
  background-color: #e9ecef;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  color: #495057;
}
</style>