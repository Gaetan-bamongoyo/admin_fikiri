import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

//  Alerts
import { AlertsModule } from './modules/alerts/alerts.module';

// Analytics engine
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Config globale du projet
import { ConfigModule } from './config/config.module';

// Core infra
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { DatabaseModule } from './database/database.module';

// Modules métier
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RidesModule } from './modules/rides/rides.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TrafficModule } from './modules/traffic/traffic.module';
import { TrajetModule } from './modules/trajet/trajet.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    //  Config système
    ConfigModule,
    DatabaseModule,

    //  Cron system (OBLIGATOIRE  + Alerts)
    ScheduleModule.forRoot(),

    //  Event system (logs + communication interne)
    EventEmitterModule.forRoot(),

    //  Auth & Users
    AuthModule,
    UsersModule,

    //  Core business modules
    IncidentsModule,
    TrafficModule,
    TrajetModule,
    GamificationModule,
    UploadsModule,
    FleetModule,

    //  Courses taxi + suivi temps réel
    RidesModule,
    RealtimeModule,

    //  intelligence layer
    AnalyticsModule,

    //  Tableau de bord admin (agrégations)
    AdminModule,

    // Alert system (prédiction trafic)
    AlertsModule,

    //  Paramètres globaux plateforme
    SettingsModule,
  ],

  providers: [
    //  Sécurité globale API (l'ordre compte : JWT résout le user, puis contrôle du rôle)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    //  Gestion globale des erreurs
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
