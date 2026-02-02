#!/usr/bin/env node
/**
 * Marathon Text Updater (HTTP/HTTPS)
 * Обновляет тексты марафона через API
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const { URL } = require('url');

const API_URL = process.env.API_URL || 'http://37.252.20.170:9527';
const MARATHON_ID = process.argv[2];
const FIELD = process.argv[3]; // 'welcomeMessage' | 'rules' | 'courseDescription'
const TEXT_FILE = process.argv[4];

// Учетные данные суперадмина
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'seplitza@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234back';

if (!MARATHON_ID || !FIELD || !TEXT_FILE) {
  console.error('❌ Usage: node update-marathon-text-http.js <marathonId> <field> <textFile>');
  console.error('   field: welcomeMessage | rules | courseDescription');
  process.exit(1);
}

// Читаем текст из файла
const textContent = fs.readFileSync(TEXT_FILE, 'utf8');

// Конвертируем Markdown в HTML (простая конвертация)
function markdownToHtml(markdown) {
  let html = markdown;
  
  // H1 заголовки
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // H2 заголовки
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  
  // H3 заголовки
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // Жирный текст
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Курсив
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Горизонтальная линия (до списков, чтобы не конфликтовать)
  html = html.replace(/^---$/gm, '<hr>');
  
  // Списки (ul) с эмодзи
  const lines = html.split('\n');
  let inList = false;
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Обычные списки
    if (line.match(/^[-⭐✅⚠️💰⏰🌱📈🎁] /)) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      const content = line.replace(/^[-⭐✅⚠️💰⏰🌱📈🎁] /, '');
      result.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  html = result.join('\n');
  
  // Параграфы (оборачиваем текст который не в тегах)
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('<') && !trimmed.endsWith('>')) {
      return `<p>${line}</p>`;
    }
    return line;
  }).join('\n');
  
  // Убираем лишние переносы
  html = html.replace(/\n{3,}/g, '\n\n');
  
  return html.trim();
}

// Функция для HTTP/HTTPS запросов
function makeRequest(url, options, postData = null) {
  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Функция для получения токена
async function getAuthToken() {
  const loginPayload = JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  const url = new URL('/api/auth/login', API_URL).href;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload)
    }
  };

  const { statusCode, data } = await makeRequest(url, options, loginPayload);
  
  if (statusCode === 200) {
    const response = JSON.parse(data);
    return response.token;
  } else {
    throw new Error(`Login failed: ${statusCode} ${data}`);
  }
}

// Функция для обновления марафона
async function updateMarathon(token, htmlContent) {
  const payload = JSON.stringify({
    [FIELD]: htmlContent
  });

  const url = new URL(`/api/marathons/admin/${MARATHON_ID}`, API_URL).href;
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${token}`
    }
  };

  const { statusCode, data } = await makeRequest(url, options, payload);
  
  if (statusCode === 200) {
    return JSON.parse(data);
  } else {
    throw new Error(`Update failed: ${statusCode} ${data}`);
  }
}

// Главная функция
async function main() {
  try {
    console.log(`🔄 Обновляем марафон ${MARATHON_ID}...`);
    console.log(`📝 Поле: ${FIELD}`);
    console.log(`📄 Файл: ${TEXT_FILE}`);
    console.log(`🌐 API: ${API_URL}`);
    
    // Конвертируем Markdown в HTML
    const htmlContent = markdownToHtml(textContent);
    console.log(`📏 HTML размер: ${htmlContent.length} символов`);
    console.log(`📄 Превью HTML (первые 200 символов):`);
    console.log(htmlContent.substring(0, 200));
    console.log('...\n');
    
    console.log('🔐 Получаем токен авторизации...');
    const token = await getAuthToken();
    console.log('✅ Токен получен');
    
    console.log('📤 Отправляем обновление...');
    const response = await updateMarathon(token, htmlContent);
    
    console.log('✅ Марафон успешно обновлен!');
    console.log(`📦 Ответ сервера:`, JSON.stringify(response, null, 2));
    
    if (API_URL.includes('37.252.20.170')) {
      console.log(`🔗 Проверьте: http://37.252.20.170:9527/admin/`);
    } else {
      console.log(`🔗 Проверьте: ${API_URL}/admin/`);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

// Запускаем
main();
