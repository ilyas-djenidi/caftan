'use strict';

module.exports = {
  apps: [
    {
      name: 'caftan-api',
      script: 'src/server.js',
      instances: 1,             // server.js handles clustering internally — do NOT set 'max' here
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '250M', // restart if Node exceeds 250MB
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
      restart_delay: 5000,        // wait 5s before restarting (was 3s)
      max_restarts: 10,
      min_uptime: '10s',          // must be up 10s to count as stable (was 5s)
    },
  ],
};
