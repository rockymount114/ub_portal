module.exports = {
  apps: [
    {
      name: 'ub-portal-monitor',
      script: './dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      time: true,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/error.log',
      out_file: './logs/combined.log',
      merge_logs: true,
    },
  ],
};
