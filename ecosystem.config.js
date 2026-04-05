module.exports = {
  apps: [{
    name: 'rejuvena-backend',
    script: './dist/server.js',
    cwd: '/var/www/rejuvena-backend',
    instances: 1,
    exec_mode: 'fork',
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
