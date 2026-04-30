import app from './app.js';

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[server]: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const port = Number(process.env.PORT) || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`[server]: Server is running on port ${port}`);
});
