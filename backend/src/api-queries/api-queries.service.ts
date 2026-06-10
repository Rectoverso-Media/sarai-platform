import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JSONPath } from 'jsonpath-plus';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApiQueriesService {
  private readonly logger = new Logger(ApiQueriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async createApiQuery(data: {
    name: string;
    endpointUrl: string;
    method?: string;
    headers?: Record<string, string>;
    bodyTemplate?: any;
    authType?: string;
    authConfig?: any;
    responseMapping?: Record<string, string>;
  }) {
    return this.prisma.apiQuery.create({
      data: {
        name: data.name,
        endpointUrl: data.endpointUrl,
        method: data.method || 'GET',
        headers: data.headers ?? Prisma.JsonNull,
        bodyTemplate: data.bodyTemplate ?? Prisma.JsonNull,
        authType: data.authType || 'NONE',
        authConfig: data.authConfig ?? Prisma.JsonNull,
        responseMapping: data.responseMapping ?? Prisma.JsonNull,
      },
    });
  }

  async getAllApiQueries() {
    return this.prisma.apiQuery.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        executions: {
          orderBy: { calledAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getApiQueryById(id: string) {
    const query = await this.prisma.apiQuery.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { calledAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!query) {
      throw new HttpException('API Query tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    return query;
  }

  async updateApiQuery(id: string, data: Partial<{
    name: string;
    endpointUrl: string;
    method: string;
    headers: any;
    bodyTemplate: any;
    authType: string;
    authConfig: any;
    responseMapping: any;
  }>) {
    const existing = await this.prisma.apiQuery.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('API Query tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    return this.prisma.apiQuery.update({ where: { id }, data });
  }

  async deleteApiQuery(id: string) {
    const existing = await this.prisma.apiQuery.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('API Query tidak ditemukan', HttpStatus.NOT_FOUND);
    }
    await this.prisma.apiQuery.delete({ where: { id } });
    return { message: 'API Query berhasil dihapus' };
  }

  // ── EXECUTE ───────────────────────────────────────────────────────────────

  async executeApiQuery(id: string) {
    const query = await this.prisma.apiQuery.findUnique({ where: { id } });
    if (!query) {
      throw new HttpException('API Query tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    const startTime = Date.now();
    let statusCode = 0;
    let responseSnapshot: any = null;
    let mappedResult: any = null;

    try {
      // 1. Build headers dengan auth injection
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(query.headers as Record<string, string> || {}),
      };

      const authType = query.authType || 'NONE';
      const authConfig = query.authConfig as any;

      if (authType === 'BEARER' && authConfig?.token) {
        headers['Authorization'] = `Bearer ${authConfig.token}`;
      } else if (authType === 'API_KEY' && authConfig?.key && authConfig?.value) {
        headers[authConfig.key] = authConfig.value;
      } else if (authType === 'BASIC' && authConfig?.username && authConfig?.password) {
        const encoded = Buffer.from(
          `${authConfig.username}:${authConfig.password}`,
        ).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }

      // 2. Build fetch options
      const fetchOptions: RequestInit = {
        method: query.method || 'GET',
        headers,
      };

      if (
        ['POST', 'PUT', 'PATCH'].includes(query.method || 'GET') &&
        query.bodyTemplate
      ) {
        fetchOptions.body = JSON.stringify(query.bodyTemplate);
      }

      // 3. Execute request (dengan timeout 30 detik)
      this.logger.log(`🌐 Executing ${query.method} ${query.endpointUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: globalThis.Response;
      try {
        response = await fetch(query.endpointUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      statusCode = response.status;

      let responseData: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      responseSnapshot = responseData;

      // 4. Apply JSONPath response mapping
      const mapping = query.responseMapping as Record<string, string> | null;
      if (mapping && typeof responseData === 'object') {
        mappedResult = {};
        for (const [fieldName, jsonPath] of Object.entries(mapping)) {
          try {
            const values = JSONPath({ path: jsonPath, json: responseData });
            mappedResult[fieldName] =
              values.length === 1 ? values[0] : values;
          } catch {
            mappedResult[fieldName] = null;
          }
        }
      } else {
        mappedResult = responseData;
      }

      const latencyMs = Date.now() - startTime;

      // 5. Simpan execution log
      await this.prisma.apiQueryExecution.create({
        data: {
          apiQueryId: id,
          statusCode,
          latencyMs,
          responseSnapshot:
            typeof responseSnapshot === 'object'
              ? responseSnapshot
              : { raw: responseSnapshot },
        },
      });

      return {
        statusCode,
        latencyMs,
        rawResponse: responseData,
        mappedResult,
        success: response.ok,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;

      // Log kegagalan network/fetch
      await this.prisma.apiQueryExecution.create({
        data: {
          apiQueryId: id,
          statusCode: statusCode || 0,
          latencyMs,
          responseSnapshot: { error: error.message },
        },
      });

      throw new HttpException(
        `Eksekusi API Query gagal: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
