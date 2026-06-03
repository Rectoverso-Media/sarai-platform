import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AirbyteService } from './airbyte.service';

@UseGuards(AuthGuard('jwt'))
@Controller('airbyte')
export class AirbyteController {
  constructor(private readonly airbyteService: AirbyteService) {}

  // ─── Workspace ───────────────────────────────────────────────────────────

  @Get('test-connection')
  testAirbyteConnection() {
    return this.airbyteService.getWorkspaceInfo();
  }

  // ─── Connector Catalog ───────────────────────────────────────────────────

  @Get('connectors')
  getAvailableConnectors() {
    return this.airbyteService.getAvailableConnectors();
  }

  // ─── Sources ─────────────────────────────────────────────────────────────

  @Get('sources')
  getSources() {
    return this.airbyteService.getSources();
  }

  @Post('sources')
  createSource(@Body() body: any) {
    return this.airbyteService.createSource(body);
  }

  @Delete('sources/:id')
  deleteSource(@Param('id') id: string) {
    return this.airbyteService.deleteSource(id);
  }

  // ─── Sync Status ─────────────────────────────────────────────────────────

  @Get('sources/:id/sync-status')
  getSyncStatus(@Param('id') id: string) {
    return this.airbyteService.getSyncStatus(id);
  }

  // ─── Connections ─────────────────────────────────────────────────────────

  @Get('connections')
  getConnections() {
    return this.airbyteService.getConnections();
  }

  @Patch('connections/:id')
  updateConnection(@Param('id') id: string, @Body() body: any) {
    return this.airbyteService.updateConnection(id, body);
  }

  @Post('connections/:id/test')
  testConnection(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.airbyteService.testConnection(id, userId);
  }

  // ─── Sync Configuration ──────────────────────────────────────────────────

  @Get('connections/:id/config')
  getSyncConfiguration(@Param('id') id: string) {
    return this.airbyteService.getSyncConfiguration(id);
  }

  @Patch('connections/:id/config')
  updateSyncConfiguration(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.airbyteService.updateSyncConfiguration(id, body, userId);
  }
}