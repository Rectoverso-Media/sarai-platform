import { Controller, Get, Post, Body } from '@nestjs/common';
import { TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getAllMembers() {
    return this.teamService.getAllMembers();
  }

  @Post()
  addMember(@Body() body: { name: string; email: string; role: string }) {
    return this.teamService.addMember(body);
  }
}