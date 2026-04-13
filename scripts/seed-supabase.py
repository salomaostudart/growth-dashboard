"""
Seed Supabase with demo projects and mock metric snapshots.

Usage:
  pip install supabase
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python scripts/seed-supabase.py

Inserts 2 projects (Demo Enterprise, Salomao Portfolio) with realistic mock data
across all 6 metric sources.
"""

import json
import os
import sys
from datetime import date, timedelta

import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}
REST_URL = f"{SUPABASE_URL}/rest/v1"
http = httpx.Client(headers=HEADERS, timeout=30)


class Table:
    """Minimal Supabase REST wrapper."""
    def __init__(self, name: str):
        self.name = name
        self.url = f"{REST_URL}/{name}"

    def upsert(self, data: dict, on_conflict: str = ""):
        headers = {**HEADERS, "Prefer": "return=representation,resolution=merge-duplicates"}
        params = {"on_conflict": on_conflict} if on_conflict else {}
        r = http.post(self.url, json=data, headers=headers, params=params)
        r.raise_for_status()
        return type("Resp", (), {"data": r.json()})()

    def insert(self, data: dict):
        r = http.post(self.url, json=data)
        r.raise_for_status()
        return type("Resp", (), {"data": r.json()})()

    def select(self, columns: str = "*"):
        self._select_cols = columns
        return self

    def eq(self, col: str, val):
        r = http.get(self.url, params={"select": self._select_cols, col: f"eq.{val}"})
        r.raise_for_status()
        data = r.json()
        return type("Resp", (), {"data": data[0] if data else None})()


class Client:
    def table(self, name: str):
        return Table(name)


client = Client()

PERIOD_END = date.today()
PERIOD_START = PERIOD_END - timedelta(days=29)

# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

PROJECTS = [
    {
        "name": "Demo Enterprise",
        "slug": "demo-enterprise",
        "domain": "demo-enterprise.ai",
        "ga4_property": "G-MOCK-RC001",
        "gsc_site_url": "https://demo-enterprise.ai/",
        "github_org": "demo-enterprise",
        "description": "AI-powered data science platform",
        "is_active": True,
    },
    {
        "name": "Salomao Portfolio",
        "slug": "salomao-portfolio",
        "domain": "salomaostudart.github.io",
        "ga4_property": "532605518",
        "gsc_site_url": "https://salomaostudart.github.io/portfolio/",
        "github_org": "salomaostudart",
        "description": "Personal portfolio and projects",
        "is_active": True,
    },
]

# ---------------------------------------------------------------------------
# Mock data generators
# ---------------------------------------------------------------------------

def ga4_data_demo-enterprise():
    return {
        "sessions": 52340,
        "users": 38920,
        "newUsers": 29180,
        "pageviews": 187600,
        "bounceRate": 0.38,
        "avgSessionDuration": 214,
        "engagementRate": 0.62,
        "conversions": 1847,
        "conversionRate": 0.035,
        "channels": [
            {"channel": "Organic Search", "sessions": 19890, "conversions": 724},
            {"channel": "Direct", "sessions": 12560, "conversions": 412},
            {"channel": "Referral", "sessions": 8740, "conversions": 298},
            {"channel": "Paid Search", "sessions": 6420, "conversions": 243},
            {"channel": "Social", "sessions": 4730, "conversions": 170},
        ],
        "topPages": [
            {"page": "/", "pageviews": 28400, "avgTime": 185},
            {"page": "/features", "pageviews": 19200, "avgTime": 247},
            {"page": "/pricing", "pageviews": 14800, "avgTime": 312},
            {"page": "/docs", "pageviews": 11200, "avgTime": 428},
            {"page": "/blog", "pageviews": 9600, "avgTime": 196},
        ],
        "devices": [
            {"device": "desktop", "sessions": 38920},
            {"device": "mobile", "sessions": 10468},
            {"device": "tablet", "sessions": 2952},
        ],
        "trend": [
            {"date": (PERIOD_START + timedelta(days=i)).isoformat(), "sessions": 1600 + (i * 28) + (80 if i % 7 < 5 else -120)}
            for i in range(30)
        ],
    }


def ga4_data_portfolio():
    return {
        "sessions": 312,
        "users": 241,
        "newUsers": 198,
        "pageviews": 874,
        "bounceRate": 0.52,
        "avgSessionDuration": 142,
        "engagementRate": 0.48,
        "conversions": 18,
        "conversionRate": 0.058,
        "channels": [
            {"channel": "Direct", "sessions": 124, "conversions": 9},
            {"channel": "Organic Search", "sessions": 87, "conversions": 5},
            {"channel": "Referral", "sessions": 64, "conversions": 3},
            {"channel": "Social", "sessions": 37, "conversions": 1},
        ],
        "topPages": [
            {"page": "/portfolio/", "pageviews": 312, "avgTime": 165},
            {"page": "/portfolio/about", "pageviews": 198, "avgTime": 134},
            {"page": "/portfolio/projects", "pageviews": 187, "avgTime": 243},
        ],
        "devices": [
            {"device": "desktop", "sessions": 198},
            {"device": "mobile", "sessions": 96},
            {"device": "tablet", "sessions": 18},
        ],
        "trend": [
            {"date": (PERIOD_START + timedelta(days=i)).isoformat(), "sessions": 8 + (i % 5)}
            for i in range(30)
        ],
    }


def gsc_data_demo-enterprise():
    return {
        "clicks": 18240,
        "impressions": 482000,
        "ctr": 0.038,
        "avgPosition": 12.4,
        "topQueries": [
            {"query": "ai data science platform", "clicks": 2840, "impressions": 48200, "ctr": 0.059, "position": 4.2},
            {"query": "demo-enterprise ai", "clicks": 2100, "impressions": 12400, "ctr": 0.169, "position": 1.8},
            {"query": "automl platform", "clicks": 1820, "impressions": 38700, "ctr": 0.047, "position": 6.1},
            {"query": "data science automation", "clicks": 1640, "impressions": 52800, "ctr": 0.031, "position": 9.3},
        ],
        "topPages": [
            {"page": "/features", "clicks": 4820, "impressions": 89400},
            {"page": "/", "clicks": 3940, "impressions": 72100},
            {"page": "/pricing", "clicks": 2180, "impressions": 41200},
        ],
        "coreWebVitals": {
            "lcp": {"good": 0.68, "needsImprovement": 0.22, "poor": 0.10},
            "fid": {"good": 0.91, "needsImprovement": 0.07, "poor": 0.02},
            "cls": {"good": 0.84, "needsImprovement": 0.12, "poor": 0.04},
        },
    }


def gsc_data_portfolio():
    return {
        "clicks": 87,
        "impressions": 3240,
        "ctr": 0.027,
        "avgPosition": 28.6,
        "topQueries": [
            {"query": "salomao studart", "clicks": 42, "impressions": 184, "ctr": 0.228, "position": 2.1},
            {"query": "growth dashboard portfolio", "clicks": 18, "impressions": 492, "ctr": 0.037, "position": 14.8},
        ],
        "topPages": [
            {"page": "/portfolio/", "clicks": 54, "impressions": 1840},
            {"page": "/portfolio/projects", "clicks": 33, "impressions": 1400},
        ],
        "coreWebVitals": {
            "lcp": {"good": 0.72, "needsImprovement": 0.20, "poor": 0.08},
            "fid": {"good": 0.94, "needsImprovement": 0.05, "poor": 0.01},
            "cls": {"good": 0.88, "needsImprovement": 0.10, "poor": 0.02},
        },
    }


def email_data_demo-enterprise():
    return {
        "sends": 48200,
        "delivered": 46872,
        "opens": 14061,
        "clicks": 3286,
        "unsubscribes": 94,
        "bounces": 1328,
        "openRate": 0.30,
        "clickRate": 0.07,
        "unsubRate": 0.002,
        "bounceRate": 0.028,
        "campaigns": [
            {"name": "Product Update — May", "sends": 12400, "openRate": 0.32, "clickRate": 0.08},
            {"name": "Webinar Invite", "sends": 8200, "openRate": 0.41, "clickRate": 0.12},
            {"name": "Newsletter #24", "sends": 14800, "openRate": 0.28, "clickRate": 0.06},
            {"name": "Onboarding — Week 1", "sends": 4900, "openRate": 0.54, "clickRate": 0.18},
        ],
        "listGrowth": [
            {"month": "Jan", "subscribers": 38400},
            {"month": "Feb", "subscribers": 40200},
            {"month": "Mar", "subscribers": 42800},
            {"month": "Apr", "subscribers": 45100},
            {"month": "May", "subscribers": 48200},
        ],
    }


def email_data_portfolio():
    return {
        "sends": 0,
        "delivered": 0,
        "opens": 0,
        "clicks": 0,
        "unsubscribes": 0,
        "bounces": 0,
        "openRate": 0,
        "clickRate": 0,
        "unsubRate": 0,
        "bounceRate": 0,
        "campaigns": [],
        "listGrowth": [],
    }


def social_data_demo-enterprise():
    return {
        "followers": {
            "linkedin": 12840,
            "twitter": 8420,
            "youtube": 3200,
        },
        "engagement": {
            "linkedin": 0.042,
            "twitter": 0.028,
            "youtube": 0.061,
        },
        "impressions": {
            "linkedin": 284000,
            "twitter": 148000,
            "youtube": 62400,
        },
        "topPosts": [
            {"platform": "linkedin", "content": "How we cut data science time by 80%", "impressions": 28400, "engagement": 0.068},
            {"platform": "twitter", "content": "AutoML is not magic — here's what it actually does", "impressions": 18200, "engagement": 0.041},
            {"platform": "youtube", "content": "Demo Enterprise in 5 minutes", "views": 12400, "watchTime": 184},
        ],
        "followerGrowth": [
            {"month": "Jan", "linkedin": 10200, "twitter": 6800},
            {"month": "Feb", "linkedin": 10840, "twitter": 7100},
            {"month": "Mar", "linkedin": 11400, "twitter": 7600},
            {"month": "Apr", "linkedin": 12100, "twitter": 8000},
            {"month": "May", "linkedin": 12840, "twitter": 8420},
        ],
    }


def social_data_portfolio():
    return {
        "followers": {
            "linkedin": 384,
            "github": 42,
        },
        "engagement": {
            "linkedin": 0.031,
            "github": 0.0,
        },
        "impressions": {
            "linkedin": 4800,
            "github": 0,
        },
        "topPosts": [
            {"platform": "linkedin", "content": "Building a growth dashboard as a portfolio project", "impressions": 1840, "engagement": 0.048},
        ],
        "followerGrowth": [
            {"month": "Jan", "linkedin": 310},
            {"month": "Feb", "linkedin": 328},
            {"month": "Mar", "linkedin": 348},
            {"month": "Apr", "linkedin": 368},
            {"month": "May", "linkedin": 384},
        ],
    }


def crm_data_demo-enterprise():
    return {
        "leads": 1240,
        "mqls": 486,
        "sqls": 198,
        "opportunities": 124,
        "closedWon": 48,
        "closedLost": 62,
        "pipeline": 2840000,
        "avgDealSize": 59166,
        "winRate": 0.44,
        "avgSalesCycle": 42,
        "conversionRates": {
            "leadToMql": 0.39,
            "mqlToSql": 0.41,
            "sqlToOpp": 0.63,
            "oppToClose": 0.44,
        },
        "stageBreakdown": [
            {"stage": "Discovery", "count": 48, "value": 840000},
            {"stage": "Demo", "count": 36, "value": 620000},
            {"stage": "Proposal", "count": 24, "value": 780000},
            {"stage": "Negotiation", "count": 16, "value": 600000},
        ],
    }


def crm_data_portfolio():
    return {
        "leads": 18,
        "mqls": 12,
        "sqls": 6,
        "opportunities": 4,
        "closedWon": 2,
        "closedLost": 1,
        "pipeline": 0,
        "avgDealSize": 0,
        "winRate": 0.67,
        "avgSalesCycle": 14,
        "conversionRates": {
            "leadToMql": 0.67,
            "mqlToSql": 0.5,
            "sqlToOpp": 0.67,
            "oppToClose": 0.5,
        },
        "stageBreakdown": [],
    }


def martech_data_demo-enterprise():
    return {
        "overallHealth": 0.91,
        "systems": [
            {"name": "HubSpot CRM", "status": "operational", "uptime": 0.999, "lastChecked": PERIOD_END.isoformat()},
            {"name": "GA4", "status": "operational", "uptime": 0.998, "lastChecked": PERIOD_END.isoformat()},
            {"name": "Mailchimp", "status": "operational", "uptime": 0.997, "lastChecked": PERIOD_END.isoformat()},
            {"name": "Webflow", "status": "operational", "uptime": 0.999, "lastChecked": PERIOD_END.isoformat()},
            {"name": "Segment", "status": "degraded", "uptime": 0.948, "lastChecked": PERIOD_END.isoformat()},
            {"name": "Intercom", "status": "operational", "uptime": 0.996, "lastChecked": PERIOD_END.isoformat()},
        ],
        "dataQuality": {
            "coverage": 0.94,
            "freshness": 0.98,
            "accuracy": 0.92,
        },
        "tagCoverage": 0.96,
        "eventTracking": 0.88,
    }


def martech_data_portfolio():
    return {
        "overallHealth": 0.96,
        "systems": [
            {"name": "GA4", "status": "operational", "uptime": 0.998, "lastChecked": PERIOD_END.isoformat()},
            {"name": "GitHub Pages", "status": "operational", "uptime": 1.0, "lastChecked": PERIOD_END.isoformat()},
        ],
        "dataQuality": {
            "coverage": 0.98,
            "freshness": 1.0,
            "accuracy": 0.96,
        },
        "tagCoverage": 0.98,
        "eventTracking": 0.72,
    }


MOCK_DATA = {
    "demo-enterprise": {
        "ga4": ga4_data_demo-enterprise(),
        "gsc": gsc_data_demo-enterprise(),
        "email": email_data_demo-enterprise(),
        "social": social_data_demo-enterprise(),
        "crm": crm_data_demo-enterprise(),
        "martech": martech_data_demo-enterprise(),
    },
    "salomao-portfolio": {
        "ga4": ga4_data_portfolio(),
        "gsc": gsc_data_portfolio(),
        "email": email_data_portfolio(),
        "social": social_data_portfolio(),
        "crm": crm_data_portfolio(),
        "martech": martech_data_portfolio(),
    },
}

# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

def seed():
    print("Seeding projects...")
    project_ids = {}

    for project in PROJECTS:
        slug = project["slug"]

        # Upsert project (insert or update by slug)
        resp = client.table("projects").upsert(project, on_conflict="slug")
        if resp.data:
            pid = resp.data[0]["id"]
            project_ids[slug] = pid
            print(f"  OK project: {project['name']} (id={pid})")
        else:
            fetch = client.table("projects").select("id").eq("slug", slug)
            pid = fetch.data["id"]
            project_ids[slug] = pid
            print(f"  EXISTS project: {project['name']} (id={pid})")

    print("\nSeeding metric snapshots...")

    for slug, sources in MOCK_DATA.items():
        pid = project_ids.get(slug)
        if not pid:
            print(f"  SKIP {slug} — no project id found")
            continue

        for source, data in sources.items():
            snapshot = {
                "project_id": pid,
                "source": source,
                "data": data,
                "period_start": PERIOD_START.isoformat(),
                "period_end": PERIOD_END.isoformat(),
            }
            resp = client.table("metric_snapshots").insert(snapshot)
            if resp.data:
                print(f"  OK snapshot: {slug}/{source}")
            else:
                print(f"  ERROR snapshot: {slug}/{source} — {resp}")

    print("\nDone.")


if __name__ == "__main__":
    seed()
