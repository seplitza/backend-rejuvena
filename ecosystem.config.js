// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  apps: [{
    name: 'rejuvena-backend',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      // Все остальные переменные из .env будут доступны через process.env
    },
    // Автоматически перезагружать при изменении
    watch: false,
    // Максимальное количество перезапусков
    max_restarts: 10,
    // Минимальное время работы перед считыванием краха
    min_uptime: '10s',
    // Максимальное использование памяти
    max_memory_restart: '500M',
  }]
};
