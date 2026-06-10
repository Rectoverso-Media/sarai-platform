import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ODataQueryParams {
  $filter?: string;
  $select?: string;
  $top?: string;
  $skip?: string;
  $orderby?: string;
  $count?: string;
  streamName?: string; // filter stream tertentu
}

@Injectable()
export class ODataService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ambil list stream yang tersedia di synced_data (untuk OData EntitySets)
   */
  async getAvailableStreams(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<{ streamName: string }[]>`
      SELECT DISTINCT "streamName" FROM synced_data ORDER BY "streamName"
    `;
    return result.map((r) => r.streamName);
  }

  /**
   * Query data dari synced_data dengan OData query params.
   * Support: $top, $skip, $select, $orderby, $count, streamName filter
   */
  async queryData(params: ODataQueryParams) {
    const top = params.$top ? parseInt(params.$top, 10) : 100;
    const skip = params.$skip ? parseInt(params.$skip, 10) : 0;

    // Validasi batas maksimum untuk keamanan
    const safeTop = Math.min(top, 10000);

    // Build WHERE clause
    const whereClause: any = {};
    if (params.streamName) {
      whereClause.streamName = params.streamName;
    }

    // Handle $filter sederhana: streamName eq 'campaigns'
    if (params.$filter && !params.streamName) {
      const eqMatch = params.$filter.match(/streamName\s+eq\s+'([^']+)'/i);
      if (eqMatch) {
        whereClause.streamName = eqMatch[1];
      }
    }

    // Build ORDER BY
    let orderBy: any = { syncedAt: 'desc' };
    if (params.$orderby) {
      const parts = params.$orderby.trim().split(/\s+/);
      const field = parts[0];
      const dir = parts[1]?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      if (['syncedAt', 'streamName', 'connectionId'].includes(field)) {
        orderBy = { [field]: dir };
      }
    }

    // Jalankan query data + count secara paralel
    const [data, totalCount] = await Promise.all([
      this.prisma.syncedData.findMany({
        where: whereClause,
        orderBy,
        take: safeTop,
        skip,
        select: {
          id: true,
          streamName: true,
          recordData: true,
          syncedAt: true,
          connectionId: true,
        },
      }),
      params.$count === 'true'
        ? this.prisma.syncedData.count({ where: whereClause })
        : Promise.resolve(undefined),
    ]);

    // Flatten recordData ke top-level (sesuai ekspektasi OData client)
    const flattenedData = data.map((item) => ({
      _id: item.id,
      _streamName: item.streamName,
      _syncedAt: item.syncedAt.toISOString(),
      _connectionId: item.connectionId,
      ...(typeof item.recordData === 'object' && item.recordData !== null
        ? item.recordData
        : { value: item.recordData }),
    }));

    // Handle $select — filter field yang dikembalikan
    let result: Record<string, any>[] = flattenedData;
    if (params.$select) {
      const fields = params.$select.split(',').map((f) => f.trim());
      result = flattenedData.map((item) => {
        const filtered: Record<string, any> = {};
        fields.forEach((f) => {
          if (f in item) filtered[f] = (item as Record<string, any>)[f];
        });
        return filtered;
      });
    }

    return { data: result, count: totalCount };
  }

  /**
   * Generate OData $metadata XML schema
   */
  async generateMetadata(): Promise<string> {
    const streams = await this.getAvailableStreams();

    const entityTypes = streams
      .map(
        (stream) => `
    <EntityType Name="${this.sanitizeXmlName(stream)}">
      <Key><PropertyRef Name="_id"/></Key>
      <Property Name="_id" Type="Edm.String" Nullable="false"/>
      <Property Name="_streamName" Type="Edm.String"/>
      <Property Name="_syncedAt" Type="Edm.DateTimeOffset"/>
      <Property Name="_connectionId" Type="Edm.String"/>
    </EntityType>`,
      )
      .join('\n');

    const entitySets = streams
      .map(
        (stream) =>
          `      <EntitySet Name="${this.sanitizeXmlName(stream)}" EntityType="SARAI.${this.sanitizeXmlName(stream)}"/>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="SARAI" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <!-- Stream Entity Types -->
      ${entityTypes}

      <!-- Generic SyncedData Entity Type -->
      <EntityType Name="SyncedData">
        <Key><PropertyRef Name="_id"/></Key>
        <Property Name="_id" Type="Edm.String" Nullable="false"/>
        <Property Name="_streamName" Type="Edm.String"/>
        <Property Name="_syncedAt" Type="Edm.DateTimeOffset"/>
        <Property Name="_connectionId" Type="Edm.String"/>
      </EntityType>

      <EntityContainer Name="SaraiContainer">
        <EntitySet Name="SyncedData" EntityType="SARAI.SyncedData"/>
${entitySets}
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;
  }

  /**
   * Info endpoint tentang streams yang tersedia
   */
  async getServiceDocument() {
    const streams = await this.getAvailableStreams();
    return {
      '@odata.context': '/odata/$metadata',
      value: [
        { name: 'SyncedData', kind: 'EntitySet', url: 'SyncedData' },
        ...streams.map((s) => ({
          name: this.sanitizeXmlName(s),
          kind: 'EntitySet',
          url: `SyncedData?$filter=streamName eq '${s}'`,
        })),
      ],
    };
  }

  private sanitizeXmlName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
