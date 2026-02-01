#!/usr/bin/env node
/**
 * Marathon Text Updater
 * Обновляет тексты марафона через API
 */

const https = require('https');

const API_URL = process.env.API_URL || 'https://api-rejuvena.duckdns.org';
const MARATHON_ID = process.argv[2];
const FIELD = process.argv[3]; // 'welcomeMessage' или 'rules'
const TEXT_FILE = process.argv[4];

// Учетные данные суперадмина
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'seplitza@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234back';

if (!MARATHON_ID || !FIELD || !TEXT_FILE) {
  console.error('❌ Usage: node update-marathon-text.js <marathonId> <field> <textFile>');
  console.error('   field: welcomeMessage | rules | courseDescription');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

// Читаем текст из файла
const textContent = fs.readFileSync(TEXT_FILE, 'utf8');

// Конвертируем Markdown в HTML (простая конвертация)
function markdownToHtml(markdown) {
  let html = markdown;
  
  // H2 заголовки
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  
  // H3 заголовки
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // Жирный текст
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Курсив
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Списки (ul)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Нумерованные списки
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Чекбоксы
  html = html.replace(/^✅ (.+)$/gm, '<p>✅ $1</p>');
  html = html.replace(/^⚠️ (.+)$/gm, '<p>⚠️ $1</p>');
  
  // Параграфы
  html = html.split('\n\n').map(para => {
    if (!para.startsWith('<') && para.trim()) {
      return `<p>${para}</p>`;
    }
    return para;
  }).join('\n');
  
  // Горизонтальная линия
  html = html.replace(/^---$/gm, '<hr>');
  
  return html;
}

// Функция для получения токена
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const loginPayload = JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    const url = new URL('/api/auth/login', API_URL);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.token);
        } else {
          reject(new Error(`Login failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(loginPayload);
    req.end();
  });
}

// Функция для обновления марафона
async function updateMarathon(token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      [FIELD]: htmlContent
    });

    const url = new URL(`/api/marathons/admin/${MARATHON_ID}`, API_URL);
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Update failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Главная функция
async function main() {
  try {
    console.log(`🔄 Обновляем марафон ${MARATHON_ID}...`);
    console.log(`📝 Поле: ${FIELD}`);
    console.log(`📄 Файл: ${TEXT_FILE}`);
    
    console.log('🔐 Получаем токен авторизации...');
    const token = await getAuthToken();
    
    console.log('📤 Отправляем обновление...');
    await updateMarathon(token);
    
    console.log('✅ Марафон успешно обновлен!');
    console.log(`🔗 Проверьте: ${API_URL}/admin/marathons/${MARATHON_ID}`);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

// Подготавливаем данные
const htmlContent = markdownToHtml(textContent);

// Запускаем
main();
