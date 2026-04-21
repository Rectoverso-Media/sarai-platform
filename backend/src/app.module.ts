import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatasourcesModule } from './datasources/datasources.module';

@Module({
  imports: [UsersModule, DatasourcesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
