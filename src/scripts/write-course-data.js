const fs = require('fs');
const path = require('path');

// Полный JSON от пользователя (скопирован из сообщения)
const courseData = require('./temp-course-data.json');

const outputPath = path.join(__dirname, 'data', 'course-full-data.json');
fs.writeFileSync(outputPath, JSON.stringify(courseData, null, 2), 'utf-8');

console.log(`✅ JSON успешно записан в ${outputPath}`);
console.log(`📦 Размер файла: ${fs.statSync(outputPath).size} байт`);
