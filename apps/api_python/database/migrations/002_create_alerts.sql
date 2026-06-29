-- Historique des alertes (partagé NestJS + api_python).

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alerts_severity_enum') THEN
        CREATE TYPE alerts_severity_enum AS ENUM ('low', 'medium', 'high');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    user_id uuid NOT NULL,
    type varchar(50) NOT NULL,
    message text NOT NULL,
    severity alerts_severity_enum NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    latitude numeric(10, 7),
    longitude numeric(10, 7),
    CONSTRAINT pk_alerts PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id_created_at
    ON alerts (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id_is_read
    ON alerts (user_id, is_read);
