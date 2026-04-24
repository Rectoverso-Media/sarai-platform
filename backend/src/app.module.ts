import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { DatasourcesModule } from './datasources/datasources.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TeamModule } from './team/team.module';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { AirbyteModule } from './airbyte/airbyte.module';
import { QueriesModule } from './queries/queries.module';

@Module({
  imports: [UsersModule, DatasourcesModule, InfrastructureModule, TeamModule, 
            SecurityModule, AuthModule, AirbyteModule, QueriesModule, ScheduleModule.forRoot(), 
            AirbyteModule, QueriesModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
