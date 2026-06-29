import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrafficReport } from './entities/traffic-report.entity';
import { TrafficSpeedSample } from './entities/traffic-speed-sample.entity';
import { TrafficTrack } from './entities/traffic-track.entity';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrafficReport,
      TrafficSpeedSample,
      TrafficTrack,
    ]),
    UsersModule,
  ],
  controllers: [TrafficController],
  providers: [TrafficService],
  exports: [TrafficService],
})
export class TrafficModule {}
