// Katalog 20 connector populer sebagai fallback / enrichment metadata
// Digunakan ketika Airbyte API tidak mengembalikan ikon/kategori/deskripsi

export interface ConnectorCatalogEntry {
  sourceDefinitionId: string;
  name: string;
  category: 'CRM' | 'Ads' | 'Database' | 'Analytics' | 'Finance' | 'Storage' | 'Marketing' | 'E-Commerce';
  icon: string; // emoji icon
  description: string;
  isTrial: boolean; // Apakah connector ini memerlukan trial sebelum full use
  supportsOAuth: boolean;
}

export const SOURCE_CATALOG: ConnectorCatalogEntry[] = [
  // ── CRM ──────────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: 'b112928d-9653-4874-a633-82a176882650',
    name: 'Salesforce',
    category: 'CRM',
    icon: '☁️',
    description: 'Sync leads, contacts, opportunities, and custom objects from Salesforce CRM.',
    isTrial: true,
    supportsOAuth: true,
  },
  {
    sourceDefinitionId: '7442111c-1647-4c0b-adf4-da0e75f5a750',
    name: 'HubSpot',
    category: 'CRM',
    icon: '🧡',
    description: 'Pull deals, contacts, companies, and marketing data from HubSpot.',
    isTrial: true,
    supportsOAuth: true,
  },
  {
    sourceDefinitionId: 'a4da7d14-9a32-4e4c-8c22-7a5e74e07b45',
    name: 'Pipedrive',
    category: 'CRM',
    icon: '🎯',
    description: 'Sync pipeline stages, deals, and contacts from Pipedrive.',
    isTrial: false,
    supportsOAuth: false,
  },

  // ── Ads ──────────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: '253487c0-2246-43ba-a21f-5116b20a2c50',
    name: 'Google Ads',
    category: 'Ads',
    icon: '📢',
    description: 'Extract campaigns, ad groups, keywords, and performance metrics from Google Ads.',
    isTrial: true,
    supportsOAuth: true,
  },
  {
    sourceDefinitionId: 'e7778cfc-e97c-4458-9ecb-b4f2bba8946c',
    name: 'Facebook Ads',
    category: 'Ads',
    icon: '👍',
    description: 'Pull ad campaigns, insights, and audience data from Meta Ads Manager.',
    isTrial: true,
    supportsOAuth: true,
  },
  {
    sourceDefinitionId: '6acf6b55-4f1e-4fca-944e-1a3caef8aca7',
    name: 'TikTok Ads',
    category: 'Ads',
    icon: '🎵',
    description: 'Sync TikTok advertising campaigns, creatives, and performance metrics.',
    isTrial: true,
    supportsOAuth: false,
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: 'eff3616a-f9c3-11ec-b939-0242ac120002',
    name: 'Google Analytics 4',
    category: 'Analytics',
    icon: '📊',
    description: 'Sync events, user properties, and conversion data from GA4.',
    isTrial: false,
    supportsOAuth: true,
  },
  {
    sourceDefinitionId: '5a9ddd01-0fea-4f0c-bdc7-8b9b4aa95b9d',
    name: 'Mixpanel',
    category: 'Analytics',
    icon: '📈',
    description: 'Pull events, funnels, retention, and user profiles from Mixpanel.',
    isTrial: false,
    supportsOAuth: false,
  },
  {
    sourceDefinitionId: '71607597-9431-466c-9223-34e8f7a83d47',
    name: 'Google Sheets',
    category: 'Storage',
    icon: '📋',
    description: 'Read data directly from Google Sheets spreadsheets as a data source.',
    isTrial: false,
    supportsOAuth: true,
  },

  // ── Database ──────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
    name: 'PostgreSQL',
    category: 'Database',
    icon: '🐘',
    description: 'Connect to PostgreSQL databases with CDC or full-refresh sync.',
    isTrial: false,
    supportsOAuth: false,
  },
  {
    sourceDefinitionId: 'b5ea17b1-f170-46dc-bc31-cc744ca984c1',
    name: 'MySQL',
    category: 'Database',
    icon: '🐬',
    description: 'Replicate tables from MySQL/MariaDB using binlog-based CDC.',
    isTrial: false,
    supportsOAuth: false,
  },
  {
    sourceDefinitionId: 'b8be6362-dff4-4a77-9b18-8c5e5e5a4a4a',
    name: 'MongoDB',
    category: 'Database',
    icon: '🍃',
    description: 'Sync collections from MongoDB Atlas or self-hosted instances.',
    isTrial: false,
    supportsOAuth: false,
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: 'a0c1d5e2-4f3b-4a3a-9e5f-0b1c2d3e4f5a',
    name: 'Stripe',
    category: 'Finance',
    icon: '💳',
    description: 'Sync payments, subscriptions, invoices, and customer data from Stripe.',
    isTrial: false,
    supportsOAuth: false,
  },
  {
    sourceDefinitionId: 'c4b7d8e9-2a1b-4c3d-8f5e-0a9b8c7d6e5f',
    name: 'QuickBooks',
    category: 'Finance',
    icon: '📒',
    description: 'Pull financial data, accounts, and transactions from QuickBooks Online.',
    isTrial: true,
    supportsOAuth: true,
  },

  // ── Marketing ─────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: 'c8b6e7f3-1a2b-4d5e-9f0a-1b2c3d4e5f6a',
    name: 'Mailchimp',
    category: 'Marketing',
    icon: '🐵',
    description: 'Sync email campaigns, lists, subscribers, and automation data from Mailchimp.',
    isTrial: false,
    supportsOAuth: true,
  },
  {
    sourceDefinitionId: 'd9c7b6a5-2b3c-4e5f-0a1b-2c3d4e5f6a7b',
    name: 'Klaviyo',
    category: 'Marketing',
    icon: '📧',
    description: 'Pull email and SMS campaign metrics, flows, and list data from Klaviyo.',
    isTrial: false,
    supportsOAuth: false,
  },

  // ── Storage ───────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: '69589781-7828-43c5-9f63-8925b1c1ccc2',
    name: 'Amazon S3',
    category: 'Storage',
    icon: '🪣',
    description: 'Read CSV, JSON, or Parquet files stored in Amazon S3 buckets.',
    isTrial: false,
    supportsOAuth: false,
  },

  // ── E-Commerce ────────────────────────────────────────────────────────────
  {
    sourceDefinitionId: 'e1f0d2c3-4b5a-6c7d-8e9f-0a1b2c3d4e5f',
    name: 'Shopify',
    category: 'E-Commerce',
    icon: '🛍️',
    description: 'Sync orders, products, customers, and inventory from Shopify stores.',
    isTrial: true,
    supportsOAuth: false,
  },
  {
    sourceDefinitionId: 'f2e1d0c9-5b6a-7c8d-9e0f-1a2b3c4d5e6f',
    name: 'WooCommerce',
    category: 'E-Commerce',
    icon: '🛒',
    description: 'Pull orders, products, and customer data from WooCommerce-powered stores.',
    isTrial: false,
    supportsOAuth: false,
  },
  {
    sourceDefinitionId: 'a3b4c5d6-7e8f-9a0b-1c2d-3e4f5a6b7c8d',
    name: 'Tokopedia',
    category: 'E-Commerce',
    icon: '🟢',
    description: 'Sync produk, pesanan, dan data toko dari platform Tokopedia (via API resmi).',
    isTrial: true,
    supportsOAuth: false,
  },
];

/**
 * Cari metadata connector berdasarkan sourceDefinitionId
 */
export function getCatalogEntry(sourceDefinitionId: string): ConnectorCatalogEntry | undefined {
  return SOURCE_CATALOG.find((c) => c.sourceDefinitionId === sourceDefinitionId);
}

/**
 * Enrich list connector dari Airbyte API dengan metadata dari catalog lokal
 */
export function enrichConnectors(airbyteConnectors: any[]): any[] {
  return airbyteConnectors.map((conn) => {
    const catalog = getCatalogEntry(conn.sourceDefinitionId);
    return {
      ...conn,
      category: catalog?.category ?? 'Other',
      icon: catalog?.icon ?? '🔌',
      description: catalog?.description ?? conn.name,
      isTrial: catalog?.isTrial ?? false,
      supportsOAuth: catalog?.supportsOAuth ?? false,
    };
  });
}

/**
 * Kembalikan catalog lokal sebagai fallback (jika Airbyte API gagal/tidak support)
 */
export function getFallbackCatalog(): any[] {
  return SOURCE_CATALOG.map((c) => ({
    sourceDefinitionId: c.sourceDefinitionId,
    name: c.name,
    category: c.category,
    icon: c.icon,
    description: c.description,
    isTrial: c.isTrial,
    supportsOAuth: c.supportsOAuth,
  }));
}
