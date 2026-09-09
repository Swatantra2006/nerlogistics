// ============================================================
// Demand Forecasting Engine
// Time-series decomposition with seasonal + trend + noise
// ============================================================

import { DemandRecord } from '@/types';
import { generateDemandHistory, districts } from '@/data/ner-data';

interface DemandForecast {
  districtId: string;
  districtName: string;
  currentDemand: number;
  forecast7Day: number;
  forecast30Day: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number;
  confidence: number;
  seasonalPattern: string;
  historicalData: { date: string; actual: number; predicted?: number }[];
  forecastData: { date: string; predicted: number; lower: number; upper: number }[];
}

function simpleMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
  }
  return result;
}

function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function forecastDemand(districtId: string): DemandForecast {
  const district = districts.find(d => d.id === districtId);
  if (!district) {
    throw new Error(`District ${districtId} not found`);
  }

  const history = generateDemandHistory(districtId, district.demandLevel, 6);

  // Aggregate daily totals
  const dailyMap = new Map<string, number>();
  history.forEach(r => {
    dailyMap.set(r.date, (dailyMap.get(r.date) || 0) + r.demand);
  });

  const sortedDates = Array.from(dailyMap.keys()).sort();
  const dailyValues = sortedDates.map(d => dailyMap.get(d) || 0);

  // Compute trend
  const smoothed = simpleMovingAverage(dailyValues, 7);
  const { slope, intercept } = linearRegression(smoothed);

  // Current demand (last 7 days average)
  const last7 = dailyValues.slice(-7);
  const currentDemand = Math.round(last7.reduce((a, b) => a + b, 0) / 7);

  // Forecast
  const n = dailyValues.length;
  const forecast7Day = Math.round(slope * (n + 3.5) + intercept);
  const forecast30Day = Math.round(slope * (n + 15) + intercept);

  // Trend
  const first30Avg = dailyValues.slice(0, 30).reduce((a, b) => a + b, 0) / 30;
  const last30Avg = dailyValues.slice(-30).reduce((a, b) => a + b, 0) / 30;
  const trendPct = ((last30Avg - first30Avg) / first30Avg) * 100;

  let trend: 'increasing' | 'stable' | 'decreasing';
  if (trendPct > 3) trend = 'increasing';
  else if (trendPct < -3) trend = 'decreasing';
  else trend = 'stable';

  // Seasonal pattern
  const monthlyAvg = new Map<number, { total: number; count: number }>();
  sortedDates.forEach((date, i) => {
    const month = parseInt(date.split('-')[1]);
    const entry = monthlyAvg.get(month) || { total: 0, count: 0 };
    entry.total += dailyValues[i];
    entry.count += 1;
    monthlyAvg.set(month, entry);
  });

  let seasonalPattern = 'Monsoon peak (Jun-Sep) with steady base demand';
  const monsoonMonths = [6, 7, 8, 9];
  const monsoonAvg = monsoonMonths.reduce((sum, m) => {
    const entry = monthlyAvg.get(m);
    return sum + (entry ? entry.total / entry.count : 0);
  }, 0) / monsoonMonths.length;
  const otherAvg = Array.from(monthlyAvg.entries())
    .filter(([m]) => !monsoonMonths.includes(m))
    .reduce((sum, [, entry]) => sum + entry.total / entry.count, 0) / Math.max(1, monthlyAvg.size - monsoonMonths.length);

  if (monsoonAvg > otherAvg * 1.15) {
    seasonalPattern = 'Strong monsoon-driven demand pattern with 15%+ increase during Jun-Sep';
  }

  // Confidence based on data stability
  const stdDev = Math.sqrt(dailyValues.reduce((sum, v) => sum + Math.pow(v - currentDemand, 2), 0) / dailyValues.length);
  const cv = stdDev / currentDemand;
  const confidence = Math.max(60, Math.min(95, Math.round(95 - cv * 30)));

  // Historical data for charts (last 30 days)
  const historicalData = sortedDates.slice(-30).map((date, i) => ({
    date,
    actual: dailyValues[dailyValues.length - 30 + i],
    predicted: Math.round(smoothed[smoothed.length - 30 + i]),
  }));

  // Forecast data (next 14 days)
  const forecastData: DemandForecast['forecastData'] = [];
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  for (let i = 1; i <= 14; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    const dateStr = futureDate.toISOString().split('T')[0];
    const predicted = Math.round(slope * (n + i) + intercept);
    const margin = Math.round(predicted * (1 - confidence / 100) * 1.5);
    forecastData.push({
      date: dateStr,
      predicted: Math.max(1, predicted),
      lower: Math.max(1, predicted - margin),
      upper: predicted + margin,
    });
  }

  return {
    districtId,
    districtName: district.name,
    currentDemand,
    forecast7Day: Math.max(1, forecast7Day),
    forecast30Day: Math.max(1, forecast30Day),
    trend,
    trendPercentage: Math.round(trendPct * 10) / 10,
    confidence,
    seasonalPattern,
    historicalData,
    forecastData,
  };
}

export function forecastAllDistricts(): DemandForecast[] {
  return districts.map(d => forecastDemand(d.id));
}

export function getTopDemandDistricts(limit: number = 10): DemandForecast[] {
  return forecastAllDistricts()
    .sort((a, b) => b.currentDemand - a.currentDemand)
    .slice(0, limit);
}
