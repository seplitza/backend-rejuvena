/**
 * Utility для генерации уникальных промокодов для Fortune Wheel
 */

import PromoCode from '../models/PromoCode.model';

/**
 * Генерирует уникальный код промокода
 * Формат: WHEEL2026-XXXXX (9 символов после префикса)
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WHEEL2026-';
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Генерирует и создает промокод для приза Колеса Фортуны
 */
export async function createWheelPromoCode(params: {
  userId: string;
  wheelSpinId: string;
  discountPercent: number;
  validUntil: Date;
  description?: string;
  minOrderAmount?: number;
}): Promise<any> {
  const { userId, wheelSpinId, discountPercent, validUntil, description, minOrderAmount } = params;

  // Генерируем уникальный код (максимум 10 попыток)
  let code = generateRandomCode();
  let attempts = 0;
  
  while (attempts < 10) {
    const existing = await PromoCode.findOne({ code });
    if (!existing) break;
    
    code = generateRandomCode();
    attempts++;
  }

  if (attempts >= 10) {
    throw new Error('Не удалось сгенерировать уникальный промокод');
  }

  // Создаем промокод
  const promoCode = new PromoCode({
    code,
    description: description || `Приз от Колеса Фортуны - скидка ${discountPercent}%`,
    discountType: 'percentage',
    discountValue: discountPercent,
    minOrderAmount: minOrderAmount || 0,
    maxUses: 1, // Промокод одноразовый
    usedCount: 0,
    validFrom: new Date(),
    validUntil,
    isActive: true,
    source: 'fortune_wheel',
    wheelSpinId,
    userId,
    // createdBy опциональный для автоматически созданных промокодов
    applicableProducts: [],
    applicableCategories: []
  });

  await promoCode.save();

  return promoCode;
}
