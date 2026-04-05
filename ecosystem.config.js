const path = require('path');

// Load environment variables from .env file in the CURRENT directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [{
    name: 'rejuvena-backend',
    script: './dist/server.js',
    cwd: __dirname,
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      // Explicitly pass all required environment variables
      PORT: process.env.PORT || '9527',
      MONGODB_URI: process.env.MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET,
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      UPLOAD_DIR: process.env.UPLOAD_DIR,
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      WB_API_TOKEN: process.env.WB_API_TOKEN,
      WB_SELLER_ID: process.env.WB_SELLER_ID,
      ALFABANK_USERNAME: process.env.ALFABANK_USERNAME,
      ALFABANK_PASSWORD: process.env.ALFABANK_PASSWORD,
      ALFABANK_API_URL: process.env.ALFABANK_API_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      OLD_API_TOKEN: process.env.OLD_API_TOKEN,
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
