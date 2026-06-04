import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

interface BlendSourceInput {
  dataSourceId: string;
  streamName: string;
  joinKey: string;
  alias?: string;
}

@Injectable()
export class BlendsService {
  private readonly logger = new Logger(BlendsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async createBlend(data: {
    name: string;
    joinType: JoinType;
    sources: BlendSourceInput[];
  }) {
    if (!data.sources || data.sources.length < 2) {
      throw new HttpException('Blend membutuhkan minimal 2 sumber data', HttpStatus.BAD_REQUEST);
    }

    try {
      const blend = await this.prisma.blend.create({
        data: {
          name: data.name,
          joinType: data.joinType,
          sources: {
            create: data.sources.map((src) => ({
              dataSourceId: src.dataSourceId,
              joinKey: src.joinKey,
            })),
          },
        },
        include: { sources: true },
      });

      return { message: 'Blend berhasil dibuat!', data: blend };
    } catch (error) {
      this.logger.error('Error createBlend:', error);
      throw new HttpException('Gagal membuat blend', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllBlends() {
    const blends = await this.prisma.blend.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sources: {
          include: { dataSource: true },
        },
      },
    });
    return { data: blends };
  }

  async getBlendById(id: string) {
    const blend = await this.prisma.blend.findUnique({
      where: { id },
      include: {
        sources: {
          include: { dataSource: true },
        },
      },
    });
    if (!blend) throw new HttpException('Blend tidak ditemukan', HttpStatus.NOT_FOUND);
    return { data: blend };
  }

  async deleteBlend(id: string) {
    try {
      await this.prisma.blend.delete({ where: { id } });
      return { message: 'Blend berhasil dihapus!' };
    } catch (error) {
      throw new HttpException('Gagal menghapus blend', HttpStatus.BAD_REQUEST);
    }
  }

  // ── BLEND EXECUTION ───────────────────────────────────────────────────────

  /**
   * Jalankan blend: fetch data dari synced_data untuk masing-masing source,
   * lakukan JOIN in-memory berdasarkan joinKey.
   *
   * Untuk MVP: support 2 source dengan INNER/LEFT join.
   * Data besar (>10.000 baris) sebaiknya pakai SQL JOIN langsung.
   */
  async executeBlend(blendId: string) {
    const blend = await this.prisma.blend.findUnique({
      where: { id: blendId },
      include: {
        sources: {
          include: { dataSource: true },
        },
      },
    });

    if (!blend) throw new HttpException('Blend tidak ditemukan', HttpStatus.NOT_FOUND);
    if (blend.sources.length < 2) {
      throw new HttpException('Blend membutuhkan minimal 2 sumber', HttpStatus.BAD_REQUEST);
    }

    const start = Date.now();
    this.logger.log(`🔀 Menjalankan blend "${blend.name}" [${blendId}] — ${blend.joinType} JOIN`);

    // ── FETCH DATA DARI SETIAP SOURCE ─────────────────────────────────────
    const sourceDatasets: { joinKey: string; data: Record<string, any>[]; sourceName: string }[] = [];

    for (const source of blend.sources) {
      // Ambil recordData dari synced_data untuk DataSource ini
      const records: any[] = await this.prisma.$queryRaw`
        SELECT sd."recordData"
        FROM synced_data sd
        INNER JOIN "Connection" c ON sd."connectionId" = c.id
        WHERE c."dataSourceId" = ${source.dataSourceId}
        LIMIT 5000
      `;

      const data = records.map((r) => r.recordData as Record<string, any>);
      sourceDatasets.push({
        joinKey: source.joinKey,
        data,
        sourceName: source.dataSource?.name ?? source.dataSourceId,
      });

      this.logger.debug(`  Source "${source.dataSource?.name}": ${data.length} baris`);
    }

    // ── IN-MEMORY JOIN ────────────────────────────────────────────────────
    const [leftDataset, rightDataset] = sourceDatasets;
    const joinType = blend.joinType as JoinType;

    const result = this.performJoin(
      leftDataset.data,
      rightDataset.data,
      leftDataset.joinKey,
      rightDataset.joinKey,
      joinType,
      leftDataset.sourceName,
      rightDataset.sourceName,
    );

    const durationMs = Date.now() - start;
    this.logger.log(`✅ Blend selesai — ${result.length} baris hasil, ${durationMs}ms`);

    return {
      blendName: blend.name,
      joinType,
      sources: blend.sources.map((s) => ({
        name: s.dataSource?.name,
        joinKey: s.joinKey,
      })),
      rowCount: result.length,
      durationMs,
      data: result.slice(0, 1000), // Batas 1000 baris untuk response
      truncated: result.length > 1000,
    };
  }

  // ── PRIVATE: IN-MEMORY JOIN LOGIC ─────────────────────────────────────────

  private performJoin(
    leftData: Record<string, any>[],
    rightData: Record<string, any>[],
    leftKey: string,
    rightKey: string,
    joinType: JoinType,
    leftName: string,
    rightName: string,
  ): Record<string, any>[] {
    // Buat index pada right dataset untuk join yang lebih cepat (O(n) bukan O(n²))
    const rightIndex = new Map<any, Record<string, any>>();
    for (const row of rightData) {
      const keyVal = row[rightKey];
      if (keyVal !== undefined && keyVal !== null) {
        rightIndex.set(String(keyVal), row);
      }
    }

    const result: Record<string, any>[] = [];

    // LEFT atau INNER JOIN
    for (const leftRow of leftData) {
      const keyVal = leftRow[leftKey];
      const rightRow = rightIndex.get(String(keyVal));

      if (rightRow) {
        // MATCHED — merge kedua baris dengan prefix nama source
        const merged: Record<string, any> = {};
        for (const [k, v] of Object.entries(leftRow)) {
          merged[`${leftName}__${k}`] = v;
        }
        for (const [k, v] of Object.entries(rightRow)) {
          merged[`${rightName}__${k}`] = v;
        }
        result.push(merged);
      } else if (joinType === 'LEFT' || joinType === 'FULL') {
        // NOT MATCHED tapi LEFT/FULL → tetap include baris kiri dengan null di kanan
        const merged: Record<string, any> = {};
        for (const [k, v] of Object.entries(leftRow)) {
          merged[`${leftName}__${k}`] = v;
        }
        // Kolom kanan jadi null
        if (rightData.length > 0) {
          for (const k of Object.keys(rightData[0])) {
            merged[`${rightName}__${k}`] = null;
          }
        }
        result.push(merged);
      }
      // Untuk INNER JOIN: skip jika tidak ada match
    }

    // RIGHT JOIN — tambahkan baris kanan yang tidak ada pasangannya
    if (joinType === 'RIGHT' || joinType === 'FULL') {
      const leftIndex = new Set(leftData.map((r) => String(r[leftKey])));
      for (const rightRow of rightData) {
        const keyVal = String(rightRow[rightKey]);
        if (!leftIndex.has(keyVal)) {
          const merged: Record<string, any> = {};
          if (leftData.length > 0) {
            for (const k of Object.keys(leftData[0])) {
              merged[`${leftName}__${k}`] = null;
            }
          }
          for (const [k, v] of Object.entries(rightRow)) {
            merged[`${rightName}__${k}`] = v;
          }
          result.push(merged);
        }
      }
    }

    return result;
  }
}
