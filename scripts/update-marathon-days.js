#!/usr/bin/env node
/**
 * Universal Marathon Day Updater
 * Usage: node scripts/update-marathon-days.js <marathonTitle> <textFile.md>
 * 
 * Example: node scripts/update-marathon-days.js "Омолодись" ОМОЛОДИСЬ_ТЕКСТЫ.md
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

// Parse command line arguments
const marathonTitle = process.argv[2];
const textFile = process.argv[3];

if (!marathonTitle || !textFile) {
  console.error('❌ Usage: node update-marathon-days.js <marathonTitle> <textFile.md>');
  console.error('   Example: node update-marathon-days.js "Омолодись" ОМОЛОДИСЬ_ТЕКСТЫ.md');
  process.exit(1);
}

// Read text file
const textFilePath = path.isAbsolute(textFile) ? textFile : path.join(__dirname, '..', textFile);
if (!fs.existsSync(textFilePath)) {
  console.error(`❌ File not found: ${textFilePath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(textFilePath, 'utf-8');

// Парсим файл и извлекаем переработанные варианты для каждого дня
function parseDayTexts(content) {
  const dayTexts = {};
  
  // Ищем блоки "## День N" с переработанным вариантом
  const dayBlocks = content.split(/(?=## День \d+)/);
  
  for (const block of dayBlocks) {
    const dayMatch = block.match(/^## День (\d+)/);
    if (!dayMatch) continue;
    
    const dayNumber = parseInt(dayMatch[1]);
    
    // Ищем раздел "### ✨ ПЕРЕРАБОТАННЫЙ ВАРИАНТ:"
    const revisedMatch = block.match(/### ✨ ПЕРЕРАБОТАННЫЙ ВАРИАНТ:\s*\n\s*---\s*\n([\s\S]*?)(?=\n---\n\n## День|\n---\n\n#|$)/);
    
    if (revisedMatch) {
      let text = revisedMatch[1].trim();
      // Удаляем завершающие "---"
      text = text.replace(/\n---\s*$/, '');
      dayTexts[dayNumber] = text;
    }
  }
  
  return dayTexts;
}

// Конвертируем Markdown в HTML
function markdownToHtml(markdown) {
  let html = markdown;
  
  // H1 заголовки
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // H2 заголовки
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  
  // H3 заголовки
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  // H4 заголовки
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  
  // Жирный текст
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Курсив
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Списки (ul)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  
  // Эмодзи списки
  const emojiPatterns = ['✅', '⚠️', '💪', '🎯', '💡', '💬', '📸', '🔄', '👶', '🦢', '👆', '🧘‍♀️', '👋', '⏱️'];
  emojiPatterns.forEach(emoji => {
    const regex = new RegExp(`^${emoji} (.+)$`, 'gm');
    html = html.replace(regex, `<p>${emoji} $1</p>`);
  });
  
  // Нумерованные списки
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Параграфы - обрабатываем по блокам
  const blocks = html.split('\n\n');
  html = blocks.map(block => {
    // Пропускаем блоки, которые уже являются HTML-тегами
    if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || 
        block.startsWith('<li') || block.startsWith('<hr') || block.startsWith('<p>')) {
      return block;
    }
    
    // Отдельная обработка для строк с эмодзи в начале
    if (/^[🌟💧🦴💪😊📐✨🧼⏱️📋🪞💋👁️💎🛌📚💬🛑🎉]/.test(block) && !block.startsWith('<')) {
      return block;
    }
    
    const trimmed = block.trim();
    if (trimmed && !trimmed.startsWith('<')) {
      return `<p>${trimmed}</p>`;
    }
    return trimmed;
  }).join('\n\n');
  
  // Группируем списки в <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>\n$&</ul>\n');
  
  // Горизонтальная линия
  html = html.replace(/^---$/gm, '<hr>');
  
  return html;
}

async function main() {
  let client;
  
  try {
    // Parse day texts from file
    console.log(`📖 Reading text file: ${textFilePath}`);
    const dayTexts = parseDayTexts(fileContent);
    const dayNumbers = Object.keys(dayTexts).map(Number).sort((a, b) => a - b);
    
    if (dayNumbers.length === 0) {
      console.error('❌ No day texts found in file. Make sure the file has "### ✨ ПЕРЕРАБОТАННЫЙ ВАРИАНТ:" sections.');
      process.exit(1);
    }
    
    console.log(`✅ Found texts for ${dayNumbers.length} days: ${dayNumbers.join(', ')}\n`);
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    console.log('✅ Connected to MongoDB\n');

    // Find marathon
    const marathonsCollection = db.collection('marathons');
    const marathon = await marathonsCollection.findOne({ 
      title: { $regex: new RegExp(marathonTitle, 'i') } 
    });
    
    if (!marathon) {
      console.error(`❌ Marathon "${marathonTitle}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found marathon: ${marathon.title}`);
    console.log(`   ID: ${marathon._id}`);
    console.log(`   Days: ${marathon.numberOfDays}\n`);

    // Update each day
    const marathonDaysCollection = db.collection('marathondays');
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const dayNumber of dayNumbers) {
      const markdown = dayTexts[dayNumber];
      const html = markdownToHtml(markdown);
      
      console.log(`📝 Updating Day ${dayNumber}...`);
      console.log(`   Markdown length: ${markdown.length} chars`);
      console.log(`   HTML length: ${html.length} chars`);
      
      const result = await marathonDaysCollection.updateOne(
        { 
          marathonId: marathon._id,
          dayNumber: dayNumber
        },
        { $set: { description: html } }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ Day ${dayNumber} updated successfully`);
        updatedCount++;
      } else {
        console.log(`⚠️  Day ${dayNumber} not found in database`);
        skippedCount++;
      }
      console.log('');
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`   ✅ Updated: ${updatedCount} days`);
    if (skippedCount > 0) {
      console.log(`   ⚠️  Skipped: ${skippedCount} days (not found in database)`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

main();
