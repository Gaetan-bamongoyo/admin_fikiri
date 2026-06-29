import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserPreferences } from '../../modules/users/entities/user-preferences.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';
import dataSource from '../data-source';

const BCRYPT_ROUNDS = 12;

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

/**
 * Utilisateurs par défaut.
 * Note : l'enum PostgreSQL `users_role_enum` ne contient que 'user' et 'admin'.
 * Les rôles 'driver'/'police' existent dans le code mais pas en base.
 */
const DEFAULT_USERS: SeedUser[] = [
  {
    email: 'admin@fikiri.cd',
    password: 'Admin@1234',
    firstName: 'Admin',
    lastName: 'Fikiri',
    phone: '+243000000000',
    role: UserRole.ADMIN,
  },
  {
    email: 'user@fikiri.cd',
    password: 'User@1234',
    firstName: 'Utilisateur',
    lastName: 'Test',
    phone: '+243000000001',
    role: UserRole.USER,
  },
];

async function seedUsers(): Promise<void> {
  await dataSource.initialize();
  console.log('🔌 Connecté à la base de données');

  const usersRepository = dataSource.getRepository(UserEntity);
  const preferencesRepository = dataSource.getRepository(UserPreferences);

  let created = 0;
  let skipped = 0;

  for (const seed of DEFAULT_USERS) {
    const email = seed.email.toLowerCase();
    const existing = await usersRepository.findOne({ where: { email } });

    if (existing) {
      console.log(`⏭️  ${email} existe déjà — ignoré`);
      skipped++;
      continue;
    }

    const passwordHash = await bcrypt.hash(seed.password, BCRYPT_ROUNDS);

    const user = await usersRepository.save(
      usersRepository.create({
        email,
        passwordHash,
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
        role: seed.role,
      }),
    );

    await preferencesRepository.save(
      preferencesRepository.create({ userId: user.id }),
    );

    console.log(`✅ Créé ${email} (${seed.role}) — mot de passe : ${seed.password}`);
    created++;
  }

  console.log(`\n🌱 Seed terminé : ${created} créé(s), ${skipped} ignoré(s)`);
  await dataSource.destroy();
}

seedUsers().catch((error) => {
  console.error('❌ Échec du seed :', error);
  process.exitCode = 1;
});
