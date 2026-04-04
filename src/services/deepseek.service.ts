/**
 * DeepSeek AI Service
 * Service for enhancing product descriptions using DeepSeek API
 */

interface EnhanceDescriptionResult {
  description: string;
  shortDescription: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

interface EnhanceDescriptionOptions {
  description: string;
  productName: string;
  additionalPrompt?: string;
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Enhance product description using DeepSeek AI
 */
export async function enhanceProductDescription(
  options: EnhanceDescriptionOptions
): Promise<EnhanceDescriptionResult> {
  const { description, productName, additionalPrompt } = options;

  const systemPrompt = `Ты - эксперт маркетолог и SEO специалист для интернет-магазина косметики и БАДов "Rejuvena". 
Твоя задача - создавать привлекательные, SEO-оптимизированные описания товаров, которые одновременно:
- Убедительны для покупателей (эмоциональный язык, польза, призывы к действию)
- Оптимизированы для поисковых систем (ключевые слова, структура, метаданные)
- Профессиональны и достоверны (без преувеличений, медицинских заявлений без подтверждений)`;

  const userPrompt = `НАЗВАНИЕ ТОВАРА: "${productName}"

ИСХОДНОЕ ОПИСАНИЕ:
${description || 'Нет описания'}

${additionalPrompt ? `ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ:\n${additionalPrompt}\n` : ''}

ЗАДАЧИ:

1. **Полное описание товара (HTML)**:
   - Объем: 400-800 слов
   - Структура с подзаголовками (<h3>)
   - Выделение ключевых преимуществ: <strong>, <em>
   - Маркированные списки для характеристик: <ul>, <li>
   - Эмоджи умеренно и стильно (5-7 на весь текст): ✨💫🌿💧🔬💎⚡
   - Естественное вплетение SEO ключевых слов (3-5% плотность)
   - Призывы к действию
   - Акцент на: безопасность, эффективность, состав, результаты

2. **Краткое описание**:
   - 2-3 предложения
   - До 150 символов
   - Главное преимущество товара
   - Для отображения в каталоге

3. **SEO метаданные**:
   - **Title**: до 60 символов, включает название товара + главное преимущество
   - **Description**: до 160 символов, призыв к действию + ключевое преимущество
   - **Keywords**: 7-10 релевантных ключевых слов на русском (через запятую)

СТИЛЬ:
- Профессиональный, но дружелюбный тон
- Фокус на пользе для покупателя
- Естественность - избегай переспама ключевыми словами
- Для косметики/БАДов: подчеркивай качество, безопасность, сертификацию
- Используй storytelling где уместно

ФОРМАТ ОТВЕТА - строго JSON:
\`\`\`json
{
  "description": "HTML описание товара",
  "shortDescription": "Краткое описание",
  "seo": {
    "title": "SEO заголовок",
    "description": "SEO описание", 
    "keywords": ["ключ1", "ключ2", "ключ3", "ключ4", "ключ5", "ключ6", "ключ7"]
  }
}
\`\`\`

ВАЖНО: Ответ должен быть ТОЛЬКО валидным JSON без дополнительного текста!`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`DeepSeek API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let result: EnhanceDescriptionResult;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse DeepSeek response as JSON');
      }
    }

    // Validate result structure
    if (!result.description || !result.shortDescription || !result.seo) {
      throw new Error('Invalid result structure from DeepSeek');
    }

    return result;
  } catch (error) {
    console.error('Error enhancing product description:', error);
    throw error;
  }
}

/**
 * Test function to verify DeepSeek API connectivity
 */
export async function testDeepSeekConnection(): Promise<boolean> {
  try {
    const result = await enhanceProductDescription({
      description: 'Тестовое описание товара',
      productName: 'Тестовый товар'
    });
    return !!result.description;
  } catch (error) {
    console.error('DeepSeek connection test failed:', error);
    return false;
  }
}
