"""
Fetch Google Search Console metrics and save as JSON snapshot.
Runs daily via GitHub Actions (data-refresh.yml).

Requires:
  pip install google-api-python-client google-auth
  GSC_SITE_URL env var (e.g. "sc-domain:salomaostudart.github.io" or URL prefix)
  GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SITE_URL = os.environ.get("GSC_SITE_URL", "https://salomaostudart.github.io/")
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "data" / "snapshots"

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def get_service():
    creds = service_account.Credentials.from_service_account_file(
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"], scopes=SCOPES
    )
    return build("searchconsole", "v1", credentials=creds)


def fetch_queries(service, days: int = 90, row_limit: int = 20):
    """Fetch top queries with position history."""
    end = datetime.now() - timedelta(days=3)  # GSC has ~3 day delay
    start = end - timedelta(days=days)

    response = service.searchanalytics().query(
        siteUrl=SITE_URL,
        body={
            "startDate": start.strftime("%Y-%m-%d"),
            "endDate": end.strftime("%Y-%m-%d"),
            "dimensions": ["query"],
            "rowLimit": row_limit,
        },
    ).execute()

    queries = []
    for row in response.get("rows", []):
        query_text = row["keys"][0]

        # Get 7-point position history (weekly snapshots)
        history = fetch_position_history(service, query_text, days)

        queries.append({
            "query": query_text,
            "impressions": int(row["impressions"]),
            "clicks": int(row["clicks"]),
            "ctr": round(row["ctr"] * 100, 2),
            "position": round(row["position"], 1),
            "positionHistory": history,
        })

    return queries


def fetch_position_history(service, query: str, days: int = 90, points: int = 7):
    """Get weekly position snapshots for a query."""
    history = []
    end = datetime.now() - timedelta(days=3)
    interval = days // points

    for i in range(points):
        week_end = end - timedelta(days=i * interval)
        week_start = week_end - timedelta(days=interval)

        try:
            response = service.searchanalytics().query(
                siteUrl=SITE_URL,
                body={
                    "startDate": week_start.strftime("%Y-%m-%d"),
                    "endDate": week_end.strftime("%Y-%m-%d"),
                    "dimensions": ["query"],
                    "dimensionFilterGroups": [{
                        "filters": [{"dimension": "query", "expression": query}]
                    }],
                    "rowLimit": 1,
                },
            ).execute()

            rows = response.get("rows", [])
            history.append(round(rows[0]["position"], 1) if rows else 0)
        except Exception:
            history.append(0)

    history.reverse()
    return history


def fetch_page_performance(service, days: int = 90, row_limit: int = 10):
    """Fetch performance by page."""
    end = datetime.now() - timedelta(days=3)
    start = end - timedelta(days=days)

    response = service.searchanalytics().query(
        siteUrl=SITE_URL,
        body={
            "startDate": start.strftime("%Y-%m-%d"),
            "endDate": end.strftime("%Y-%m-%d"),
            "dimensions": ["page"],
            "rowLimit": row_limit,
        },
    ).execute()

    return [
        {
            "page": row["keys"][0],
            "impressions": int(row["impressions"]),
            "clicks": int(row["clicks"]),
            "ctr": round(row["ctr"] * 100, 2),
            "position": round(row["position"], 1),
        }
        for row in response.get("rows", [])
    ]


def main():
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("ERROR: GOOGLE_APPLICATION_CREDENTIALS not set", file=sys.stderr)
        sys.exit(1)

    service = get_service()
    queries = fetch_queries(service)
    pages = fetch_page_performance(service)

    total_impressions = sum(q["impressions"] for q in queries)
    total_clicks = sum(q["clicks"] for q in queries)
    avg_ctr = round(total_clicks / total_impressions * 100, 2) if total_impressions > 0 else 0
    avg_position = round(sum(q["position"] for q in queries) / len(queries), 1) if queries else 0

    data = {
        "impressions": total_impressions,
        "clicks": total_clicks,
        "ctr": avg_ctr,
        "avgPosition": avg_position,
        "topQueries": queries,
        "pagePerformance": pages,
    }

    snapshot = {
        "fetchedAt": datetime.now().isoformat(),
        "siteUrl": SITE_URL,
        "data": data,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "gsc-snapshot.json"
    output_path.write_text(json.dumps(snapshot, indent=2))
    print(f"Snapshot saved to {output_path}")


if __name__ == "__main__":
    main()
