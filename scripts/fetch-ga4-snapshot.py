"""
Fetch GA4 metrics and save as JSON snapshot.
Runs daily via GitHub Actions (data-refresh.yml).

Requires:
  pip install google-analytics-data
  GA4_PROPERTY_ID env var
  GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)

PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "532605518")
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "snapshots"


def run_report(client, dimensions: list[str], metrics: list[str], days: int = 90):
    """Run a GA4 report and return rows as list of dicts."""
    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name=m) for m in metrics],
        date_ranges=[DateRange(
            start_date=(datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d"),
            end_date="today",
        )],
    )
    response = client.run_report(request)
    rows = []
    for row in response.rows:
        entry = {}
        for i, dim in enumerate(dimensions):
            entry[dim] = row.dimension_values[i].value
        for i, met in enumerate(metrics):
            val = row.metric_values[i].value
            entry[met] = float(val) if "." in val else int(val)
        rows.append(entry)
    return rows


def fetch_all(client):
    """Fetch all metrics needed by the WebMetrics schema."""

    # Traffic by day (90 days)
    daily = run_report(
        client,
        dimensions=["date"],
        metrics=["sessions", "totalUsers"],
        days=90,
    )
    daily.sort(key=lambda r: r["date"])
    traffic_by_day = [
        {"date": f'{r["date"][:4]}-{r["date"][4:6]}-{r["date"][6:]}', "sessions": r["sessions"], "users": r["totalUsers"]}
        for r in daily
    ]

    # Totals (30 days)
    totals = run_report(
        client,
        dimensions=[],
        metrics=[
            "sessions", "totalUsers", "screenPageViews",
            "bounceRate", "averageSessionDuration", "conversions",
        ],
        days=30,
    )
    t = totals[0] if totals else {}

    sessions = t.get("sessions", 0)
    conversions = t.get("conversions", 0)
    conversion_rate = round((conversions / sessions * 100), 1) if sessions > 0 else 0

    # Top pages
    pages = run_report(
        client,
        dimensions=["pagePath"],
        metrics=["screenPageViews", "averageSessionDuration"],
        days=30,
    )
    pages.sort(key=lambda r: r["screenPageViews"], reverse=True)
    top_pages = [
        {"path": r["pagePath"], "views": r["screenPageViews"], "avgTime": round(r["averageSessionDuration"], 1)}
        for r in pages[:10]
    ]

    # Device breakdown
    devices = run_report(
        client,
        dimensions=["deviceCategory"],
        metrics=["sessions"],
        days=30,
    )
    device_map = {r["deviceCategory"]: r["sessions"] for r in devices}
    total_dev = sum(device_map.values()) or 1
    device_breakdown = {
        "desktop": round(device_map.get("desktop", 0) / total_dev * 100, 1),
        "mobile": round(device_map.get("mobile", 0) / total_dev * 100, 1),
        "tablet": round(device_map.get("tablet", 0) / total_dev * 100, 1),
    }

    # Channel mix
    channels = run_report(
        client,
        dimensions=["sessionDefaultChannelGroup"],
        metrics=["sessions"],
        days=30,
    )
    ch_map = {r["sessionDefaultChannelGroup"].lower(): r["sessions"] for r in channels}
    total_ch = sum(ch_map.values()) or 1
    channel_mix = {
        "organic": round(ch_map.get("organic search", 0) / total_ch * 100, 1),
        "direct": round(ch_map.get("direct", 0) / total_ch * 100, 1),
        "social": round(ch_map.get("organic social", 0) / total_ch * 100, 1),
        "email": round(ch_map.get("email", 0) / total_ch * 100, 1),
        "paid": round(ch_map.get("paid search", 0) / total_ch * 100, 1),
        "referral": round(ch_map.get("referral", 0) / total_ch * 100, 1),
    }

    return {
        "sessions": sessions,
        "users": t.get("totalUsers", 0),
        "pageviews": t.get("screenPageViews", 0),
        "bounceRate": round(t.get("bounceRate", 0) * 100, 1),
        "avgSessionDuration": round(t.get("averageSessionDuration", 0), 1),
        "conversionRate": conversion_rate,
        "topPages": top_pages,
        "deviceBreakdown": device_breakdown,
        "trafficByDay": traffic_by_day,
        "channelMix": channel_mix,
    }


def main():
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("ERROR: GOOGLE_APPLICATION_CREDENTIALS not set", file=sys.stderr)
        sys.exit(1)

    client = BetaAnalyticsDataClient()
    data = fetch_all(client)

    snapshot = {
        "fetchedAt": datetime.now().isoformat(),
        "propertyId": PROPERTY_ID,
        "data": data,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "ga4-snapshot.json"
    output_path.write_text(json.dumps(snapshot, indent=2))
    print(f"Snapshot saved to {output_path}")


if __name__ == "__main__":
    main()
