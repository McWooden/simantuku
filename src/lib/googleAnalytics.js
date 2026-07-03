import { BetaAnalyticsDataClient } from '@google-analytics/data';

let client = null;

function getClient() {
  if (client) return client;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return null;
  }

  try {
    client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });
    return client;
  } catch (error) {
    console.error('Failed to initialize GA client:', error);
    return null;
  }
}

export async function getGoogleAnalyticsReport() {
  const propertyId = process.env.GA_PROPERTY_ID;
  const analyticsClient = getClient();

  if (!propertyId || !analyticsClient) {
    return null;
  }

  try {
    // 1. Get 30-day summary metrics
    const [summaryResponse] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' }
      ]
    });

    const summaryRow = summaryResponse.rows?.[0];
    const totalUsers = parseInt(summaryRow?.metricValues?.[0]?.value || '0', 10);
    const totalPageViews = parseInt(summaryRow?.metricValues?.[1]?.value || '0', 10);

    // 2. Get daily breakdown over the last 7 days for a small visual trend
    const [dailyResponse] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
    });

    const dailyTrend = (dailyResponse.rows || []).map(row => {
      const rawDate = row.dimensionValues?.[0]?.value || ''; // format: YYYYMMDD
      const formattedDate = rawDate.length === 8 
        ? `${rawDate.slice(6, 8)}/${rawDate.slice(4, 6)}` 
        : rawDate;

      return {
        dateLabel: formattedDate,
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
        pageViews: parseInt(row.metricValues?.[1]?.value || '0', 10)
      };
    });

    return {
      totalUsers,
      totalPageViews,
      dailyTrend
    };
  } catch (error) {
    console.error('Error fetching Google Analytics report:', error);
    return null;
  }
}
