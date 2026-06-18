import { Controller, Get, Query, Res, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ODataService, ODataQueryParams } from './odata.service';

@ApiTags('OData (BI Connector)')
@Controller('odata')
export class ODataController {
  constructor(private readonly odataService: ODataService) {}

  // GET /odata — Service document (daftar entity sets)
  // Tidak butuh auth agar Looker Studio & Power BI bisa discover endpoint
  @Get()
  @ApiOperation({ summary: 'OData service document — daftar entity sets (no auth)' })
  @ApiResponse({ status: 200, description: 'Service document berhasil diambil' })
  async getServiceDocument() {
    const doc = await this.odataService.getServiceDocument();
    return doc;
  }

  // GET /odata/$metadata — OData metadata/schema XML
  @Get('\\$metadata')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @ApiOperation({ summary: 'OData metadata schema dalam format XML' })
  @ApiResponse({ status: 200, description: 'Metadata XML berhasil diambil' })
  async getMetadata(@Res() res: Response) {
    const xml = await this.odataService.generateMetadata();
    return res.send(xml);
  }

  // GET /odata/SyncedData — Query data dengan OData params
  // Auth via query param token untuk kompatibilitas Power BI & Looker Studio
  @Get('SyncedData')
  @ApiOperation({ summary: 'Query synced data dengan OData params ($filter, $select, $top, dll)' })
  @ApiResponse({ status: 200, description: 'Data berhasil diambil dalam format OData' })
  async getSyncedData(
    @Query('$filter') $filter?: string,
    @Query('$select') $select?: string,
    @Query('$top') $top?: string,
    @Query('$skip') $skip?: string,
    @Query('$orderby') $orderby?: string,
    @Query('$count') $count?: string,
    @Query('streamName') streamName?: string,
  ) {
    const params: ODataQueryParams = {
      $filter,
      $select,
      $top,
      $skip,
      $orderby,
      $count,
      streamName,
    };

    const { data, count } = await this.odataService.queryData(params);

    // Kembalikan dalam format OData standard
    const response: Record<string, any> = {
      '@odata.context': '/odata/$metadata#SyncedData',
      value: data,
    };

    if (count !== undefined) {
      response['@odata.count'] = count;
    }

    return response;
  }

  // GET /odata/streams — List stream yang tersedia (helper endpoint)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Get('streams')
  @ApiOperation({ summary: 'List stream synced data yang tersedia (butuh auth)' })
  @ApiResponse({ status: 200, description: 'Daftar stream berhasil diambil' })
  async getAvailableStreams() {
    const streams = await this.odataService.getAvailableStreams();
    return { streams };
  }
}
