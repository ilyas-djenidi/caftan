'use strict';

module.exports = {
  apps: [
    {
      name: 'caftan-api',
      script: 'src/server.js',
      instances: 'max',        // uses all CPU cores (server.js also cluster-forks internally)
      exec_mode: 'fork',        // we handle clustering ourselves; use fork for PM2
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',
    },
  ],
};
