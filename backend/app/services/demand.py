"""
Demand Forecasting Engine — Python port of frontend demand/engine.ts
Time-series forecasting with moving average smoothing, linear trend analysis, and seasonal decomposition.
"""

from typing import List, Dict, Any, Tuple
import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.geo import District
from app.models.demand import DemandHistory
from app.schemas.schemas import DemandForecast, HistoricalDataPoint, ForecastDataPoint


def simple_moving_average(data: List[float], window: int = 7) -> List[float]:
    result: List[float] = []
    for i in range(len(data)):
        if i < window - 1:
            result.append(data[i])
        else:
            slice_ = data[i - window + 1 : i + 1]
            result.append(sum(slice_) / window)
    return result


def linear_regression(data: List[float]) -> Tuple[float, float]:
    n = len(data)
    if n == 0:
        return 0.0, 0.0
    sum_x = sum(range(n))
    sum_y = sum(data)
    sum_xy = sum(i * data[i] for i in range(n))
    sum_x2 = sum(i * i for i in range(n))

    denom = (n * sum_x2 - sum_x * sum_x)
    if denom == 0:
        return 0.0, sum_y / n
    slope = (n * sum_xy - sum_x * sum_y) / denom
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept


def forecast_demand(db: Session, district_id: str) -> DemandForecast:
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise ValueError(f"District {district_id} not found")

    history_records = (
        db.query(DemandHistory)
        .filter(DemandHistory.district_id == district_id)
        .order_by(DemandHistory.date.asc())
        .all()
    )

    daily_map: Dict[str, float] = {}
    for r in history_records:
        daily_map[r.date] = daily_map.get(r.date, 0.0) + r.demand

    # Fallback if DB history is empty: synthesize history based on demand_level
    if not daily_map:
        base_demand = district.demand_level * 5.0 + 50.0
        start_date = datetime.now() - timedelta(days=180)
        for d in range(180):
            day_date = (start_date + timedelta(days=d)).strftime("%Y-%m-%d")
            month = (start_date + timedelta(days=d)).month
            seasonal = 1.3 if month in [6, 7, 8, 9] else 1.0
            noise = 1.0 + (math.sin(d * 0.2) * 0.15)
            val = round(base_demand * seasonal * noise)
            daily_map[day_date] = max(10.0, float(val))

    sorted_dates = sorted(daily_map.keys())
    daily_values = [daily_map[d] for d in sorted_dates]

    smoothed = simple_moving_average(daily_values, 7)
    slope, intercept = linear_regression(smoothed)

    # Current demand (last 7 days average)
    last_7 = daily_values[-7:] if len(daily_values) >= 7 else daily_values
    current_demand = round(sum(last_7) / max(1, len(last_7)))

    n = len(daily_values)
    forecast_7_day = max(1, round(slope * (n + 3.5) + intercept))
    forecast_30_day = max(1, round(slope * (n + 15) + intercept))

    first_30 = daily_values[:30] if len(daily_values) >= 30 else daily_values
    last_30 = daily_values[-30:] if len(daily_values) >= 30 else daily_values

    first_30_avg = sum(first_30) / max(1, len(first_30))
    last_30_avg = sum(last_30) / max(1, len(last_30))

    trend_pct = ((last_30_avg - first_30_avg) / max(1.0, first_30_avg)) * 100.0

    if trend_pct > 3.0:
        trend = "increasing"
    elif trend_pct < -3.0:
        trend = "decreasing"
    else:
        trend = "stable"

    # Seasonal pattern
    monthly_totals: Dict[int, float] = {}
    monthly_counts: Dict[int, int] = {}
    for i, date_str in enumerate(sorted_dates):
        month = int(date_str.split("-")[1])
        monthly_totals[month] = monthly_totals.get(month, 0.0) + daily_values[i]
        monthly_counts[month] = monthly_counts.get(month, 0) + 1

    monsoon_months = [6, 7, 8, 9]
    monsoon_avg = sum(
        monthly_totals.get(m, 0.0) / max(1, monthly_counts.get(m, 1))
        for m in monsoon_months
    ) / len(monsoon_months)

    other_months = [m for m in monthly_totals.keys() if m not in monsoon_months]
    other_avg = (
        sum(monthly_totals.get(m, 0.0) / max(1, monthly_counts.get(m, 1)) for m in other_months)
        / max(1, len(other_months))
    )

    seasonal_pattern = "Monsoon peak (Jun-Sep) with steady base demand"
    if monsoon_avg > other_avg * 1.15:
        seasonal_pattern = "Strong monsoon-driven demand pattern with 15%+ increase during Jun-Sep"

    std_dev = math.sqrt(
        sum((v - current_demand) ** 2 for v in daily_values) / max(1, len(daily_values))
    )
    cv = std_dev / max(1.0, float(current_demand))
    confidence = max(60, min(95, round(95 - cv * 30)))

    # Historical data points (last 30 days)
    history_window = 30
    recent_dates = sorted_dates[-history_window:]
    hist_points: List[HistoricalDataPoint] = []
    for i, d_str in enumerate(recent_dates):
        idx = len(daily_values) - len(recent_dates) + i
        hist_points.append(
            HistoricalDataPoint(
                date=d_str,
                actual=round(daily_values[idx]),
                predicted=round(smoothed[idx]),
            )
        )

    # Forecast data points (next 14 days)
    forecast_points: List[ForecastDataPoint] = []
    last_dt = datetime.strptime(sorted_dates[-1], "%Y-%m-%d")
    for i in range(1, 15):
        fut_dt = last_dt + timedelta(days=i)
        predicted = max(1, round(slope * (n + i) + intercept))
        margin = round(predicted * (1.0 - confidence / 100.0) * 1.5)
        forecast_points.append(
            ForecastDataPoint(
                date=fut_dt.strftime("%Y-%m-%d"),
                predicted=predicted,
                lower=max(1, predicted - margin),
                upper=predicted + margin,
            )
        )

    return DemandForecast(
        districtId=district.id,
        districtName=district.name,
        currentDemand=current_demand,
        forecast7Day=forecast_7_day,
        forecast30Day=forecast_30_day,
        trend=trend,
        trendPercentage=round(trend_pct * 10) / 10,
        confidence=confidence,
        seasonalPattern=seasonal_pattern,
        historicalData=hist_points,
        forecastData=forecast_points,
    )


def forecast_all_districts(db: Session) -> List[DemandForecast]:
    districts = db.query(District).all()
    return [forecast_demand(db, d.id) for d in districts]


def get_top_demand_districts(db: Session, limit: int = 10) -> List[DemandForecast]:
    all_forecasts = forecast_all_districts(db)
    all_forecasts.sort(key=lambda x: x.currentDemand, reverse=True)
    return all_forecasts[:limit]
