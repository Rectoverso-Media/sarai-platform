import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ODataService, ODataQueryParams } from './odata.service';

@Controller('odata')
export class ODataController {
  constructor(private readonly odataService: ODataService) {}

  // GET /odata — Service document (daftar entity sets)
  // Tidak butuh auth agar Looker Studio & Power BI bisa discover endpoint
  @Get()
  async getServiceDocument() {
    const doc = await this.odataService.getServiceDocument();
    return doc;
  }

  // GET /odata/$metadata — OData metadata/schema XML
  @Get('\\$metadata')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async getMetadata(@Res() res: Response) {
    const xml = await this.odataService.generateMetadata();
    return res.send(xml);
  }

  // GET /odata/SyncedData — Query data dengan OData params
  // Auth via query param token untuk kompatibilitas Power BI & Looker Studio
  @Get('SyncedData')
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
  @Get('streams')
  async getAvailableStreams() {
    const streams = await this.odataService.getAvailableStreams();
    return { streams };
  }
}
