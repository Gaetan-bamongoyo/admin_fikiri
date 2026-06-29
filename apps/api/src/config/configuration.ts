export default () => ({
  port: parseInt(process.env.PORT ?? '7540', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'fikiri_traffic',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    runMigrations: process.env.DB_RUN_MIGRATIONS === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  realtime: {
    /** Origines autorisées pour le WebSocket (CSV). `*` par défaut en dev. */
    corsOrigin: process.env.REALTIME_CORS_ORIGIN ?? '*',
    /** Active le simulateur de courses/positions (démo temps réel). */
    simulator: process.env.RIDES_SIMULATOR === 'true',
  },
  notifications: {
    /** URL de api_python (ex. http://localhost:8000). */
    pythonApiUrl: process.env.PYTHON_API_URL ?? 'http://localhost:8000',
    /** Secret partagé avec api_python pour POST /notifications/dispatch. */
    internalSecret: process.env.NOTIFICATIONS_INTERNAL_SECRET ?? '',
    /** Fréquence du cron alertes intelligentes (minutes). */
    alertsCronIntervalMinutes: parseInt(
      process.env.ALERTS_CRON_INTERVAL_MINUTES ?? '5',
      10,
    ),
  },
});
