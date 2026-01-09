/**
 * Exercise Access Utilities
 * Determines exercise pricing and user access based on tags
 * 
 * Pricing Logic:
 * - Free: exercises with "На здоровье" tag (case-insensitive)
 * - Basic (100₽): exercises with "Базовое" tag
 * - PRO (200₽): exercises with "Продвинутое" or "PRO" tags
 */

export interface ExerciseAccessInfo {
  isFree: boolean;
  price: number;
  isLocked: boolean;
  isPro: boolean;
  badge: string | null;
}

/**
 * Check if exercise has a specific tag (case-insensitive)
 */
function hasTag(tags: string[] | undefined, tagName: string): boolean {
  if (!tags || !Array.isArray(tags)) return false;
  return tags.some(tag => 
    tag.toLowerCase().trim() === tagName.toLowerCase().trim()
  );
}

/**
 * Get exercise access information based on tags
 */
export function getExerciseAccess(tags: string[] | undefined): ExerciseAccessInfo {
  // Check for free tag
  if (hasTag(tags, 'На здоровье')) {
    return {
      isFree: true,
      price: 0,
      isLocked: false,
      isPro: false,
      badge: 'Бесплатно'
    };
  }

  // Check for PRO tags (Продвинутое or PRO)
  if (hasTag(tags, 'Продвинутое') || hasTag(tags, 'PRO')) {
    return {
      isFree: false,
      price: 200,
      isLocked: true,
      isPro: true,
      badge: 'PRO 200₽'
    };
  }

  // Check for Basic tag
  if (hasTag(tags, 'Базовое')) {
    return {
      isFree: false,
      price: 100,
      isLocked: true,
      isPro: false,
      badge: '100₽'
    };
  }

  // Default: free if no pricing tags
  return {
    isFree: true,
    price: 0,
    isLocked: false,
    isPro: false,
    badge: null
  };
}

/**
 * Check if user has purchased an exercise
 */
export function hasUserAccess(exerciseName: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const purchases = JSON.parse(localStorage.getItem('exercisePurchases') || '[]');
    return purchases.includes(exerciseName);
  } catch (error) {
    console.error('Error checking user access:', error);
    return false;
  }
}

/**
 * Mark exercise as purchased
 */
export function markAsPurchased(exerciseName: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const purchases = JSON.parse(localStorage.getItem('exercisePurchases') || '[]');
    if (!purchases.includes(exerciseName)) {
      purchases.push(exerciseName);
      localStorage.setItem('exercisePurchases', JSON.stringify(purchases));
    }
  } catch (error) {
    console.error('Error marking as purchased:', error);
  }
}

/**
 * Get all purchased exercises
 */
export function getPurchasedExercises(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('exercisePurchases') || '[]');
  } catch (error) {
    console.error('Error getting purchased exercises:', error);
    return [];
  }
}

/**
 * Clear all purchases (for testing)
 */
export function clearPurchases(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('exercisePurchases');
}

/**
 * Get display badge text for exercise
 */
export function getExerciseBadge(tags: string[] | undefined): string | null {
  const access = getExerciseAccess(tags);
  return access.badge;
}
