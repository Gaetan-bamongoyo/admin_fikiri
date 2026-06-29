-- Tokens FCM pour les notifications push (api_python).
-- À exécuter une fois sur la base PostgreSQL partagée avec NestJS.

CREATE TABLE IF NOT EXISTS device_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    user_id uuid NOT NULL,
    fcm_token varchar(512) NOT NULL,
    platform varchar(20) NOT NULL,
    CONSTRAINT pk_device_tokens PRIMARY KEY (id),
    CONSTRAINT uq_device_tokens_fcm_token UNIQUE (fcm_token),
    CONSTRAINT fk_device_tokens_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id
    ON device_tokens (user_id);
