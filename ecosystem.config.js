const path = require('path')
module.exports = {
  apps: [{
    name: 'ccframe',
    script: './node_modules/next/dist/bin/next',
    args: 'start',
    cwd: process.cwd(),
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, 'config/production.env')
      : path.resolve(__dirname, '.env'),
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=2048',
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.next',
      '.git',
      'uploads'
    ],
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 1000
  }]
}
