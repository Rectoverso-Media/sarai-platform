import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatasourcesModule } from './datasources/datasources.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TeamModule } from './team/team.module';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UsersModule, DatasourcesModule, InfrastructureModule, TeamModule, SecurityModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
