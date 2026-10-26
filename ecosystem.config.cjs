const path = require('path');

module.exports = {
  apps: [
    {
      name: 'ub-portal-monitor',
      script: path.resolve(__dirname, 'dist', 'index.js'),
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      time: true,
      env: {
        NODE_ENV: 'production',
      },
      error_file: path.resolve(__dirname, 'logs', 'error.log'),
      out_file: path.resolve(__dirname, 'logs', 'combined.log'),
      merge_logs: true,
    },
  ],
};
