/**
 * Mock Data Generator — creates realistic data with variance.
 * Patterns: weekday/weekend dips, seasonal trends, occasional spikes.
 */

// Seedable random for reproducible data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Each generator creates its own RNG instance to avoid shared mutable state.
// This ensures test order independence and reproducible results per-generator.
function createRng(seed: number) {
  const rand = seededRandom(seed);
  return {
    rand,
    between: (min: number, max: number) => min + rand() * (max - min),
    int: (min: number, max: number) => Math.floor(min + rand() * (max - min + 1)),
  };
}

// Each generator re-seeds before use. All helpers read from _rng.
let _rng = createRng(42);

function generateForecast(data: number[], daysAhead: number): Array<{ date: string; projected: number; confidence: [number, number] }> {
  // Simple linear regression
  const n = data.length;
  const lastN = Math.min(n, 30); // use last 30 days for trend
  const recent = data.slice(-lastN);

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < recent.length; i++) {
    sumX += i;
    sumY += recent[i];
    sumXY += i * recent[i];
    sumX2 += i * i;
  }
  const slope = (recent.length * sumXY - sumX * sumY) / (recent.length * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / recent.length;

  const forecast = [];
  const now = new Date();
  const variance = recent.reduce((acc, v) => acc + Math.pow(v - (sumY / recent.length), 2), 0) / recent.length;
  const stdDev = Math.sqrt(variance);

  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const projected = Math.max(0, Math.round(intercept + slope * (recent.length + i)));
    forecast.push({
      date: d.toISOString().split('T')[0],
      projected,
      confidence: [
        Math.max(0, Math.round(projected - 1.96 * stdDev)),
        Math.round(projected + 1.96 * stdDev),
      ] as [number, number],
    });
  }
  return forecast;
}

function rand(): number { return _rng.rand(); }
function randomBetween(min: number, max: number): number { return _rng.between(min, max); }
function randomInt(min: number, max: number): number { return _rng.int(min, max); }

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

// Traffic with realistic patterns
function generateDailyTraffic(days: number, baseSessions: number): Array<{ date: string; sessions: number; users: number }> {
  const dates = generateDateRange(days);
  return dates.map((date, i) => {
    const weekendFactor = isWeekend(date) ? 0.6 : 1.0;
    const trendFactor = 1 + (i / days) * 0.15; // slight upward trend
    const noise = randomBetween(0.85, 1.15);
    const spike = rand() > 0.95 ? randomBetween(1.5, 2.5) : 1; // 5% chance of spike

    const sessions = Math.round(baseSessions * weekendFactor * trendFactor * noise * spike);
    const users = Math.round(sessions * randomBetween(0.65, 0.8));
    return { date, sessions, users };
  });
}

export function generateWebMetrics() {
  _rng = createRng(100);
  const trafficByDay = generateDailyTraffic(90, 320);
  const totalSessions = trafficByDay.reduce((sum, d) => sum + d.sessions, 0);
  const totalUsers = trafficByDay.reduce((sum, d) => sum + d.users, 0);

  return {
    sessions: totalSessions,
    users: totalUsers,
    pageviews: Math.round(totalSessions * randomBetween(2.1, 3.4)),
    bounceRate: Number(randomBetween(38, 55).toFixed(1)),
    avgSessionDuration: Number(randomBetween(120, 280).toFixed(0)),
    conversionRate: Number(randomBetween(1.8, 4.2).toFixed(1)),
    topPages: [
      { path: '/', views: randomInt(8000, 15000), avgTime: randomInt(45, 120) },
      { path: '/platform', views: randomInt(3000, 7000), avgTime: randomInt(90, 200) },
      { path: '/solutions', views: randomInt(2000, 5000), avgTime: randomInt(60, 150) },
      { path: '/pricing', views: randomInt(1500, 4000), avgTime: randomInt(100, 250) },
      { path: '/resources', views: randomInt(1000, 3000), avgTime: randomInt(80, 180) },
      { path: '/about', views: randomInt(800, 2000), avgTime: randomInt(40, 90) },
      { path: '/contact', views: randomInt(500, 1500), avgTime: randomInt(120, 300) },
      { path: '/blog/ai-agents-guide', views: randomInt(400, 1200), avgTime: randomInt(180, 400) },
      { path: '/customers', views: randomInt(300, 1000), avgTime: randomInt(60, 140) },
      { path: '/careers', views: randomInt(200, 800), avgTime: randomInt(90, 200) },
    ],
    deviceBreakdown: {
      desktop: Number(randomBetween(58, 68).toFixed(1)),
      mobile: Number(randomBetween(25, 35).toFixed(1)),
      tablet: Number(randomBetween(4, 8).toFixed(1)),
    },
    trafficByDay,
    channelMix: (() => {
      const raw = {
        organic: randomBetween(35, 48),
        direct: randomBetween(18, 28),
        social: randomBetween(8, 15),
        email: randomBetween(5, 12),
        paid: randomBetween(8, 18),
        referral: randomBetween(3, 8),
      };
      const total = Object.values(raw).reduce((s, v) => s + v, 0);
      return Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, Number((v / total * 100).toFixed(1))])
      ) as typeof raw;
    })(),
    targets: {
      sessions: { target: 12000, period: 'monthly' },
      users: { target: 8000, period: 'monthly' },
      bounceRate: { target: 40, period: 'monthly', direction: 'lower' as const },
      conversionRate: { target: 3.5, period: 'monthly' },
    },
    forecast: generateForecast(trafficByDay.map(d => d.sessions), 30),
  };
}

export function generateSeoMetrics() {
  _rng = createRng(200);
  const topQueries = [
    'growth dashboard', 'enterprise ai platform', 'ai agents enterprise',
    'marketing automation ai', 'no code ai platform', 'ai workflow builder',
    'enterprise ai solutions', 'ai data platform', 'predictive analytics platform',
    'machine learning enterprise', 'ai process automation', 'data science platform',
    'ai agents business', 'automated ai workflows', 'enterprise ml ops',
    'ai canvas tool', 'business ai solutions', 'ai driven analytics',
    'intelligent automation platform', 'ai agent framework',
  ].map((query, i) => ({
    query,
    impressions: randomInt(200 - i * 8, 800 - i * 20),
    clicks: randomInt(10 - Math.min(i, 8), 120 - i * 5),
    ctr: Number(randomBetween(1.5, 12).toFixed(1)),
    position: Number(randomBetween(1 + i * 0.5, 5 + i * 2).toFixed(1)),
    positionHistory: Array.from({ length: 7 }, () => Number(randomBetween(1 + i * 0.3, 8 + i * 1.5).toFixed(1))),
  }));

  const totalImpressions = topQueries.reduce((s, q) => s + q.impressions, 0);
  const totalClicks = topQueries.reduce((s, q) => s + q.clicks, 0);

  return {
    impressions: totalImpressions,
    clicks: totalClicks,
    ctr: Number(((totalClicks / totalImpressions) * 100).toFixed(1)),
    avgPosition: Number(randomBetween(8.5, 18.2).toFixed(1)),
    topQueries,
    pagePerformance: [
      { page: '/', impressions: randomInt(3000, 8000), clicks: randomInt(200, 600), ctr: Number(randomBetween(5, 12).toFixed(1)), position: Number(randomBetween(2, 6).toFixed(1)) },
      { page: '/platform', impressions: randomInt(1500, 4000), clicks: randomInt(100, 350), ctr: Number(randomBetween(4, 10).toFixed(1)), position: Number(randomBetween(3, 8).toFixed(1)) },
      { page: '/solutions', impressions: randomInt(1000, 3000), clicks: randomInt(50, 200), ctr: Number(randomBetween(3, 8).toFixed(1)), position: Number(randomBetween(5, 12).toFixed(1)) },
    ],
    targets: {
      impressions: { target: 15000, period: 'monthly' },
      clicks: { target: 1500, period: 'monthly' },
      avgPosition: { target: 8, period: 'monthly', direction: 'lower' as const },
    },
  };
}

export function generateEmailMetrics() {
  _rng = createRng(300);
  const campaigns = Array.from({ length: 10 }, (_, i) => {
    const sent = randomInt(3000, 12000);
    const opens = Math.round(sent * randomBetween(0.18, 0.35));
    const clicks = Math.round(opens * randomBetween(0.08, 0.22));
    const d = new Date();
    d.setDate(d.getDate() - i * randomInt(3, 7));
    return {
      name: ['Product Launch', 'Monthly Newsletter', 'Feature Update', 'Webinar Invite', 'Case Study', 'Holiday Special', 'Platform Update', 'AI Guide Series', 'Customer Spotlight', 'Year in Review'][i],
      sentDate: d.toISOString().split('T')[0],
      sent,
      opens,
      clicks,
      openRate: Number(((opens / sent) * 100).toFixed(1)),
      clickRate: Number(((clicks / sent) * 100).toFixed(1)),
    };
  });

  const bestSendTimes: Array<{ day: number; hour: number; engagement: number }> = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour < 22; hour++) {
      const isBusinessHour = hour >= 9 && hour <= 17;
      const isTuesdayWednesday = day >= 2 && day <= 3;
      const base = isBusinessHour ? 60 : 20;
      const bonus = isTuesdayWednesday ? 20 : 0;
      bestSendTimes.push({ day, hour, engagement: Math.round(base + bonus + randomBetween(-10, 15)) });
    }
  }

  return {
    openRate: Number(randomBetween(22, 32).toFixed(1)),
    clickRate: Number(randomBetween(3.5, 7.2).toFixed(1)),
    unsubscribeRate: Number(randomBetween(0.1, 0.4).toFixed(2)),
    listGrowthRate: Number(randomBetween(1.2, 4.5).toFixed(1)),
    totalSubscribers: randomInt(15000, 45000),
    campaigns,
    automations: [
      { name: 'Welcome Series', status: 'active' as const, lastTriggered: new Date().toISOString(), successRate: Number(randomBetween(94, 99).toFixed(1)), totalRuns: randomInt(500, 2000) },
      { name: 'Lead Nurture', status: 'active' as const, lastTriggered: new Date().toISOString(), successRate: Number(randomBetween(90, 97).toFixed(1)), totalRuns: randomInt(200, 800) },
      { name: 'Re-engagement', status: 'active' as const, lastTriggered: new Date().toISOString(), successRate: Number(randomBetween(85, 95).toFixed(1)), totalRuns: randomInt(100, 400) },
      { name: 'Onboarding Flow', status: 'paused' as const, lastTriggered: new Date(Date.now() - 7 * 86400000).toISOString(), successRate: Number(randomBetween(88, 96).toFixed(1)), totalRuns: randomInt(50, 200) },
    ],
    bestSendTimes,
    targets: {
      openRate: { target: 28, period: 'monthly' },
      clickRate: { target: 5, period: 'monthly' },
      listGrowthRate: { target: 3, period: 'monthly' },
    },
  };
}

export function generateSocialMetrics() {
  _rng = createRng(400);
  const dates = generateDateRange(30);
  return {
    platforms: [
      { name: 'LinkedIn', followers: randomInt(12000, 28000), followerGrowth: Number(randomBetween(2.5, 6.8).toFixed(1)), engagementRate: Number(randomBetween(3.2, 5.8).toFixed(1)), referralTraffic: randomInt(800, 2500), posts: randomInt(15, 30) },
      { name: 'Twitter/X', followers: randomInt(5000, 15000), followerGrowth: Number(randomBetween(1.0, 3.5).toFixed(1)), engagementRate: Number(randomBetween(1.5, 3.2).toFixed(1)), referralTraffic: randomInt(300, 1200), posts: randomInt(25, 60) },
      { name: 'YouTube', followers: randomInt(2000, 8000), followerGrowth: Number(randomBetween(3.0, 8.0).toFixed(1)), engagementRate: Number(randomBetween(4.0, 8.5).toFixed(1)), referralTraffic: randomInt(200, 800), posts: randomInt(4, 12) },
      { name: 'Instagram', followers: randomInt(3000, 10000), followerGrowth: Number(randomBetween(1.5, 4.2).toFixed(1)), engagementRate: Number(randomBetween(2.0, 4.5).toFixed(1)), referralTraffic: randomInt(100, 500), posts: randomInt(10, 25) },
    ],
    topPosts: Array.from({ length: 8 }, (_, i) => {
      const platforms = ['LinkedIn', 'Twitter/X', 'YouTube', 'Instagram'];
      const d = new Date();
      d.setDate(d.getDate() - randomInt(1, 28));
      return {
        platform: platforms[i % 4],
        content: ['How AI agents are transforming enterprise workflows', 'New case study: 35% efficiency gains in manufacturing', 'Watch: Platform demo walkthrough', 'Behind the scenes: building our hybrid approach'][i % 4],
        date: d.toISOString().split('T')[0],
        engagement: randomInt(50, 500),
        reach: randomInt(2000, 15000),
        clicks: randomInt(20, 300),
      };
    }),
    referralByDay: dates.flatMap(date =>
      ['LinkedIn', 'Twitter/X', 'YouTube', 'Instagram'].map(platform => ({
        date,
        sessions: randomInt(5, platform === 'LinkedIn' ? 100 : 40),
        platform,
      }))
    ),
  };
}

export function generateCrmMetrics() {
  _rng = createRng(500);
  const leads = randomInt(800, 1500);
  const mql = Math.round(leads * randomBetween(0.35, 0.5));
  const sql = Math.round(mql * randomBetween(0.3, 0.45));
  const pipeline = Math.round(sql * randomBetween(0.4, 0.6));
  const won = Math.round(pipeline * randomBetween(0.2, 0.35));

  const dates = generateDateRange(30);

  return {
    funnel: { leads, mql, sql, pipeline, won },
    leadVelocity: dates.map(date => ({
      date,
      leads: Math.round(randomInt(15, 60) * (isWeekend(date) ? 0.3 : 1)),
    })),
    channelAttribution: [
      { channel: 'Organic Search', leads: randomInt(200, 400), mql: randomInt(80, 180), sql: randomInt(25, 70), pipeline: randomInt(10, 35), won: randomInt(3, 12), cac: randomInt(50, 150) },
      { channel: 'Paid Search', leads: randomInt(150, 300), mql: randomInt(60, 130), sql: randomInt(20, 55), pipeline: randomInt(8, 25), won: randomInt(2, 8), cac: randomInt(180, 350) },
      { channel: 'Social Media', leads: randomInt(100, 250), mql: randomInt(40, 100), sql: randomInt(12, 35), pipeline: randomInt(5, 18), won: randomInt(1, 6), cac: randomInt(120, 280) },
      { channel: 'Email', leads: randomInt(80, 200), mql: randomInt(50, 120), sql: randomInt(18, 45), pipeline: randomInt(8, 22), won: randomInt(2, 8), cac: randomInt(30, 80) },
      { channel: 'Referral', leads: randomInt(50, 120), mql: randomInt(30, 70), sql: randomInt(15, 35), pipeline: randomInt(6, 18), won: randomInt(2, 7), cac: randomInt(20, 60) },
      { channel: 'Direct', leads: randomInt(80, 180), mql: randomInt(35, 80), sql: randomInt(10, 30), pipeline: randomInt(4, 15), won: randomInt(1, 5), cac: randomInt(0, 20) },
    ],
    pipelineByStage: [
      { stage: 'Discovery', value: randomInt(200000, 500000), count: randomInt(30, 60), confidence: 'low' as const },
      { stage: 'Qualification', value: randomInt(150000, 400000), count: randomInt(20, 40), confidence: 'low' as const },
      { stage: 'Proposal', value: randomInt(100000, 300000), count: randomInt(10, 25), confidence: 'medium' as const },
      { stage: 'Negotiation', value: randomInt(80000, 200000), count: randomInt(5, 15), confidence: 'medium' as const },
      { stage: 'Closed Won', value: randomInt(50000, 150000), count: randomInt(3, 10), confidence: 'high' as const },
    ],
    targets: {
      leads: { target: 1200, period: 'monthly' },
      mql: { target: 500, period: 'monthly' },
      sql: { target: 200, period: 'monthly' },
      pipelineValue: { target: 500000, period: 'monthly' },
    },
  };
}

export function generateMartechHealth() {
  _rng = createRng(600);
  const now = new Date();
  return {
    systems: [
      { name: 'Google Analytics 4', status: 'healthy' as const, uptime: Number(randomBetween(99.5, 99.99).toFixed(2)), lastSync: new Date(now.getTime() - randomInt(1, 30) * 60000).toISOString(), latencyMs: randomInt(80, 250), monthlyCost: 0 },
      { name: 'Google Search Console', status: 'healthy' as const, uptime: Number(randomBetween(99.0, 99.95).toFixed(2)), lastSync: new Date(now.getTime() - randomInt(60, 360) * 60000).toISOString(), latencyMs: randomInt(120, 400), monthlyCost: 0 },
      { name: 'HubSpot CRM', status: 'healthy' as const, uptime: Number(randomBetween(99.5, 99.99).toFixed(2)), lastSync: new Date(now.getTime() - randomInt(1, 15) * 60000).toISOString(), latencyMs: randomInt(150, 350), monthlyCost: 800 },
      { name: 'Webflow CMS', status: 'healthy' as const, uptime: Number(randomBetween(99.8, 99.99).toFixed(2)), lastSync: new Date(now.getTime() - randomInt(30, 120) * 60000).toISOString(), latencyMs: randomInt(50, 150), monthlyCost: 39 },
      { name: 'Mailchimp', status: 'degraded' as const, uptime: Number(randomBetween(97.0, 99.5).toFixed(2)), lastSync: new Date(now.getTime() - randomInt(120, 480) * 60000).toISOString(), latencyMs: randomInt(300, 800), monthlyCost: 150 },
      { name: 'LinkedIn API', status: 'healthy' as const, uptime: Number(randomBetween(98.5, 99.8).toFixed(2)), lastSync: new Date(now.getTime() - randomInt(30, 180) * 60000).toISOString(), latencyMs: randomInt(200, 500), monthlyCost: 0 },
    ],
    automationLog: Array.from({ length: 20 }, (_, i) => {
      const names = ['Lead Scoring', 'Email Welcome', 'CRM Sync', 'Social Post', 'Report Generation', 'Data Cleanup', 'Alert Check', 'Backup'];
      const statuses: Array<'success' | 'failed' | 'partial'> = ['success', 'success', 'success', 'success', 'partial', 'failed'];
      return {
        name: names[i % names.length],
        status: statuses[randomInt(0, statuses.length - 1)],
        timestamp: new Date(now.getTime() - i * randomInt(30, 120) * 60000).toISOString(),
        durationMs: randomInt(200, 15000),
        recordsProcessed: randomInt(10, 5000),
      };
    }),
  };
}
