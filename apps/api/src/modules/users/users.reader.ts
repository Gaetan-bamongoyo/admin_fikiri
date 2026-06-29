import type { UserRole } from '../../common/enums/user-role.enum';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';

export const USERS_READER = Symbol('USERS_READER');

/** User fields required by auth flows — decoupled from the TypeORM entity */
export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  loyaltyPoints: number;
  createdAt: Date;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface UsersReader {
  create(dto: CreateUserDto): Promise<AuthUserRecord>;
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  toResponse(user: AuthUserRecord): UserResponseDto;
}
