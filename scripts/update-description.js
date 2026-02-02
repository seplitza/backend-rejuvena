#!/usr/bin/env node
const http = require('http');
const fs = require('fs');

const MARATHON_ID = '696fab9cd2a8c56f62ebdb09';
const EMAIL = 'seplitza@gmail.com';
const PASSWORD = '1234back';

const textContent = fs.readFileSync('/Users/alexeipinaev/Documents/Rejuvena/Backend-rejuvena/marathon-texts/course-description-short.md', 'utf8');

function markdownToHtml(markdown) {
  let html = markdown;
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><h/g, '<h').replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
  html = html.replace(/<p><hr><\/p>/g, '<hr>');
  html = html.replace(/<p><\/p>/g, '');
  return html;
}

const htmlContent = markdownToHtml(textContent);

const loginData = JSON.stringify({ email: EMAIL, password: PASSWORD });
const loginOptions = {
  hostname: '37.252.20.170',
  port: 9527,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

console.log('🔐 Авторизация...');
const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (!response.token) {
        console.error('❌ Ошибка авторизации:', data);
        process.exit(1);
      }
      
      const token = response.token;
      console.log('✅ Токен получен');
      
      const updateData = JSON.stringify({ courseDescription: htmlContent });
      const updateOptions = {
        hostname: '37.252.20.170',
        port: 9527,
        path: `/api/marathons/${MARATHON_ID}`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(updateData)
        }
      };
      
      console.log('📝 Обновляю описание...');
      const updateReq = http.request(updateOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Описание обновлено!');
          } else {
            console.error('❌ Ошибка:', res.statusCode, data);
          }
        });
      });
      
      updateReq.on('error', (e) => {
        console.error('❌ Ошибка:', e.message);
      });
      
      updateReq.write(updateData);
      updateReq.end();
      
    } catch (e) {
      console.error('❌ Ошибка:', e.message);
    }
  });
});

loginReq.on('error', (e) => {
  console.error('❌ Ошибка:', e.message);
});

loginReq.write(loginData);
loginReq.end();
