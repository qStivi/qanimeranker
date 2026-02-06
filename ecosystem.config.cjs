// PM2 configuration for production
module.exports = {
  apps: [
    {
      name: 'anime-ranker-prod',
      script: 'server/dist/index.js',
      cwd: '/opt/anime-ranker-prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'anime-ranker-dev',
      script: 'server/dist/index.js',
      cwd: '/opt/anime-ranker-dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
