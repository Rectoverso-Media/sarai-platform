import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatasourcesModule } from './datasources/datasources.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [UsersModule, DatasourcesModule, InfrastructureModule, TeamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
