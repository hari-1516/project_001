const getCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const isProduction = process.env.NODE_ENV === 'production';

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production');
  }

  console.warn('JWT_SECRET is not set. Using a development-only fallback secret.');
  return 'development_only_secret_change_me';
};

module.exports = {
  isProduction,
  port: process.env.PORT || 5000,
  jwtSecret: getJwtSecret(),
  corsOrigins: getCsv(process.env.CORS_ORIGINS, [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]),
};
