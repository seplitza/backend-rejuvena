/**
 * Тест для проверки работы функций парсинга VK Video iframe
 * 
 * Запустите в консоли браузера на странице админки для проверки
 */

// Функция для извлечения src из iframe кода
const extractIframeSrc = (iframeCode) => {
  const srcMatch = iframeCode.match(/src=["']([^"']+)["']/);
  return srcMatch ? srcMatch[1] : null;
};

// Функция для парсинга video URL
const getVideoEmbedUrl = (url) => {
  // VK Video - video_ext.php (embed URL с параметрами)
  const vkExtRegex = /vkvideo\.ru\/video_ext\.php\?([^"'\s]+)/;
  const vkExtMatch = url.match(vkExtRegex);
  if (vkExtMatch) {
    return {
      embedUrl: url,
      type: 'vk',
      isPrivate: false
    };
  }
  
  // VK Video (оба формата: vk.com и vkvideo.ru)
  const vkRegex = /(?:vk\.com\/video|vkvideo\.ru\/video)(-?\d+_\d+)(?:\?.*)?/;
  const vkMatch = url.match(vkRegex);
  if (vkMatch) {
    const hasAccessParams = /[?&](sh|list)=/.test(url);
    
    if (hasAccessParams) {
      return {
        embedUrl: url,
        type: 'vk',
        isPrivate: true
      };
    } else {
      return {
        embedUrl: `https://vk.com/video_ext.php?oid=${vkMatch[1].split('_')[0]}&id=${vkMatch[1].split('_')[1]}`,
        type: 'vk',
        isPrivate: false
      };
    }
  }
  
  return null;
};

// Тестовые случаи
const testCases = [
  {
    name: 'VK Video iframe код (полный)',
    input: '<iframe src="https://vkvideo.ru/video_ext.php?oid=-227551209&id=456239300&hash=56fcd03782ddf732&hd=3" width="1280" height="720" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;" frameborder="0" allowfullscreen></iframe>',
    expected: 'https://vkvideo.ru/video_ext.php?oid=-227551209&id=456239300&hash=56fcd03782ddf732&hd=3'
  },
  {
    name: 'VK Video URL из iframe (прямой)',
    input: 'https://vkvideo.ru/video_ext.php?oid=-227551209&id=456239300&hash=56fcd03782ddf732&hd=3',
    expected: 'https://vkvideo.ru/video_ext.php?oid=-227551209&id=456239300&hash=56fcd03782ddf732&hd=3'
  },
  {
    name: 'VK Video обычный URL (публичное видео)',
    input: 'https://vk.com/video-227551209_456239300',
    expected: 'https://vk.com/video_ext.php?oid=-227551209&id=456239300'
  },
  {
    name: 'VK Video URL с параметрами доступа (приватное)',
    input: 'https://vk.com/video-227551209_456239300?list=abc123&sh=def456',
    expected: 'https://vk.com/video-227551209_456239300?list=abc123&sh=def456' // isPrivate: true
  }
];

// Запуск тестов
console.log('🧪 Запуск тестов VK Video parsing...\n');

testCases.forEach((testCase, index) => {
  console.log(`\n--- Тест ${index + 1}: ${testCase.name} ---`);
  console.log('Входные данные:', testCase.input);
  
  let url = testCase.input;
  
  // Если это iframe код - извлекаем src
  if (url.includes('<iframe') && url.includes('</iframe>')) {
    const src = extractIframeSrc(url);
    console.log('Извлеченный src:', src);
    if (src) {
      url = src;
    } else {
      console.error('❌ Не удалось извлечь src из iframe');
      return;
    }
  }
  
  // Парсим URL
  const result = getVideoEmbedUrl(url);
  console.log('Результат парсинга:', result);
  
  // Проверка
  if (result && result.embedUrl === testCase.expected) {
    console.log('✅ Тест пройден!');
  } else {
    console.error('❌ Тест провален!');
    console.error('Ожидалось:', testCase.expected);
    console.error('Получено:', result?.embedUrl || 'null');
  }
});

console.log('\n\n✨ Все тесты завершены!');
