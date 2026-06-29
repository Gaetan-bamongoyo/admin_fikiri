import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserEntity } from './entities/user.entity';
import { USERS_READER } from './users.reader';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserPreferences])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_READER,
      useExisting: UsersService,
    },
  ],
  exports: [UsersService, USERS_READER],
})
export class UsersModule {}
