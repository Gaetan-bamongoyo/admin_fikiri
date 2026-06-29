const SECONDS_PER_UNIT: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

export function parseJwtExpiresIn(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());

  if (!match) {
    return 60 * 60 * 24 * 7;
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  return amount * SECONDS_PER_UNIT[unit];
}
