import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trajet } from './entities/trajet.entity';
import { TrajetController } from './trajet.controller';
import { TrajetService } from './trajet.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trajet])],
  controllers: [TrajetController],
  providers: [TrajetService],
  exports: [TrajetService],
})
export class TrajetModule {}
