import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from '../incidents/entities/incident.entity';
import { TrafficReport } from '../traffic/entities/traffic-report.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, TrafficReport, UserEntity])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
