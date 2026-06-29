import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings } from './entities/app-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSettings)
    private readonly settingsRepository: Repository<AppSettings>,
  ) {}

  /** Renvoie l'unique ligne de paramètres, en la créant au besoin. */
  async get(): Promise<AppSettings> {
    const existing = await this.settingsRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    if (existing) return existing;
    return this.settingsRepository.save(this.settingsRepository.create({}));
  }

  async update(dto: UpdateSettingsDto): Promise<AppSettings> {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.settingsRepository.save(settings);
  }
}
