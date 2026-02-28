/**
 * Shop Routes - Public API for e-commerce
 * Endpoints for product browsing, cart, checkout
 */

import express, { Response } from 'express';
import Product from '../models/Product.model';
import ProductCategory from '../models/ProductCategory.model';
import Order from '../models/Order.model';
import PromoCode from '../models/PromoCode.model';
import MarketplacePrice from '../models/MarketplacePrice.model';
import User from '../models/User.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * GET /api/shop/products
 * Get all active products with filters
 * Query params: categoryId, search, sortBy (price|popularity|newest), minPrice, maxPrice
 */
router.get('/products', async (req, res) => {
  try {
    const { categoryId, search, sortBy = 'popularity', minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    const query: any = { isActive: true };

    // Category filter
    if (categoryId) {
      query.category = categoryId;
    }

    // Search by name/description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sort: any = {};
    switch (sortBy) {
      case 'price':
        sort.price = 1;
        break;
      case 'price_desc':
        sort.price = -1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'popularity':
      default:
        sort.salesCount = -1;
        break;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    // Fetch latest marketplace prices for products with WB/Ozon links
    const productsWithPrices = await Promise.all(
      products.map(async (product: any) => {
        const marketplacePrices: any = {};

        if (product.articleWB) {
          const wbPrice = await MarketplacePrice.findOne({
            product: product._id,
            marketplace: 'wildberries'
          })
            .sort({ fetchedAt: -1 })
            .lean();
          if (wbPrice) {
            marketplacePrices.wildberries = {
              price: wbPrice.price,
              fetchedAt: wbPrice.fetchedAt
            };
          }
        }

        if (product.skuOzon) {
          const ozonPrice = await MarketplacePrice.findOne({
            product: product._id,
            marketplace: 'ozon'
          })
            .sort({ fetchedAt: -1 })
            .lean();
          if (ozonPrice) {
            marketplacePrices.ozon = {
              price: ozonPrice.price,
              fetchedAt: ozonPrice.fetchedAt
            };
          }
        }

        // Calculate savings
        let maxMarketplacePrice = 0;
        if (marketplacePrices.wildberries?.price) {
          maxMarketplacePrice = Math.max(maxMarketplacePrice, marketplacePrices.wildberries.price);
        }
        if (marketplacePrices.ozon?.price) {
          maxMarketplacePrice = Math.max(maxMarketplacePrice, marketplacePrices.ozon.price);
        }

        const savings = maxMarketplacePrice > product.price 
          ? maxMarketplacePrice - product.price 
          : 0;

        return {
          ...product,
          marketplacePrices,
          savings,
          savingsPercent: maxMarketplacePrice > 0 
            ? Math.round((savings / maxMarketplacePrice) * 100) 
            : 0
        };
      })
    );

    res.json({
      products: productsWithPrices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Не удалось загрузить товары' });
  }
});

/**
 * GET /api/shop/products/:id
 * Get single product details
 */
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      isActive: true 
    })
      .populate('category', 'name slug')
      .populate('bundleItems.product', 'name price images')
      .lean();

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Fetch marketplace prices
    const [wbPrice, ozonPrice] = await Promise.all([
      product.articleWB 
        ? MarketplacePrice.findOne({ 
            product: product._id, 
            marketplace: 'wildberries' 
          }).sort({ fetchedAt: -1 }).lean()
        : null,
      product.skuOzon
        ? MarketplacePrice.findOne({ 
            product: product._id, 
            marketplace: 'ozon' 
          }).sort({ fetchedAt: -1 }).lean()
        : null
    ]);

    const marketplacePrices: any = {};
    if (wbPrice) {
      marketplacePrices.wildberries = {
        price: wbPrice.price,
        fetchedAt: wbPrice.fetchedAt,
        url: `https://www.wildberries.ru/catalog/${product.articleWB}/detail.aspx`
      };
    }
    if (ozonPrice) {
      marketplacePrices.ozon = {
        price: ozonPrice.price,
        fetchedAt: ozonPrice.fetchedAt,
        url: `https://www.ozon.ru/product/${product.skuOzon}`
      };
    }

    // Calculate savings
    let maxMarketplacePrice = 0;
    if (wbPrice?.price) maxMarketplacePrice = Math.max(maxMarketplacePrice, wbPrice.price);
    if (ozonPrice?.price) maxMarketplacePrice = Math.max(maxMarketplacePrice, ozonPrice.price);

    const savings = maxMarketplacePrice > product.price 
      ? maxMarketplacePrice - product.price 
      : 0;

    res.json({
      ...product,
      marketplacePrices,
      savings,
      savingsPercent: maxMarketplacePrice > 0 
        ? Math.round((savings / maxMarketplacePrice) * 100) 
        : 0
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Не удалось загрузить товар' });
  }
});

/**
 * GET /api/shop/categories
 * Get all active categories with hierarchy
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await ProductCategory.find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Build hierarchy (root categories with children)
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat._id.toString(), { ...cat, children: [] }));

    const rootCategories: any[] = [];
    categories.forEach(cat => {
      const categoryData = categoryMap.get(cat._id.toString());
      if (cat.parentCategory) {
        const parent = categoryMap.get(cat.parentCategory._id?.toString() || cat.parentCategory.toString());
        if (parent) {
          parent.children.push(categoryData);
        }
      } else {
        rootCategories.push(categoryData);
      }
    });

    res.json(rootCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Не удалось загрузить категории' });
  }
});

/**
 * POST /api/shop/validate-promo
 * Validate promo code
 */
router.post('/validate-promo', async (req, res) => {
  try {
    const { code, cartTotal, productIds } = req.body;

    const promo = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promo) {
      return res.status(404).json({ error: 'Промокод не найден' });
    }

    // Check expiry
    if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
      return res.status(400).json({ error: 'Промокод истек' });
    }

    // Check usage limit
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ error: 'Промокод больше не действителен' });
    }

    // Check minimum order
    if (promo.minOrderAmount && cartTotal < promo.minOrderAmount) {
      return res.status(400).json({ 
        error: `Минимальная сумма заказа для использования промокода: ${promo.minOrderAmount}₽` 
      });
    }

    // Check product/category restrictions
    if (promo.applicableProducts && promo.applicableProducts.length > 0) {
      const hasApplicableProducts = productIds.some((id: string) => 
        promo.applicableProducts?.some(p => p.toString() === id)
      );
      if (!hasApplicableProducts) {
        return res.status(400).json({ error: 'Промокод не применим к товарам в корзине' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = Math.round(cartTotal * promo.discountValue / 100);
    } else if (promo.discountType === 'fixed') {
      discountAmount = promo.discountValue;
    }

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        freeShipping: promo.freeShipping
      },
      discountAmount,
      freeShipping: promo.freeShipping
    });
  } catch (error) {
    console.error('Error validating promo:', error);
    res.status(500).json({ error: 'Ошибка проверки промокода' });
  }
});

/**
 * POST /api/shop/checkout
 * Create order (requires authentication)
 */
router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const {
      items, // [{ product, quantity, price }]
      shippingAddress,
      deliveryMethod, // 'courier' | 'pickup' | 'cdek'
      cdekOfficeCode, // if deliveryMethod === 'cdek'
      paymentMethod, // 'online' | 'cash' | 'card'
      promoCode,
      usePersonalDiscount,
      fortuneWheelGiftIds, // Apply won gifts
      contactMethod, // 'phone' | 'telegram' | 'whatsapp' | 'viber' | 'vk'
      notes
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.product, isActive: true });
      if (!product) {
        return res.status(400).json({ error: `Товар ${item.product} не найден` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Недостаточно товара "${product.name}" на складе` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    // Apply promo code
    let promoDiscount = 0;
    let freeShipping = false;
    let promoCodeDoc = null;

    if (promoCode) {
      promoCodeDoc = await PromoCode.findOne({ 
        code: promoCode.toUpperCase(),
        isActive: true
      });

      if (promoCodeDoc) {
        if (promoCodeDoc.discountType === 'percentage') {
          promoDiscount = Math.round(subtotal * promoCodeDoc.discountValue / 100);
        } else if (promoCodeDoc.discountType === 'fixed') {
          promoDiscount = promoCodeDoc.discountValue;
        }
        freeShipping = promoCodeDoc.freeShipping || false;
      }
    }

    // Apply personal discount
    let personalDiscount = 0;
    if (usePersonalDiscount && user.personalDiscount) {
      if (!user.personalDiscountExpiry || new Date(user.personalDiscountExpiry) > new Date()) {
        personalDiscount = Math.round(subtotal * user.personalDiscount / 100);
      }
    }

    // Apply Fortune Wheel gifts (free products)
    const appliedGifts: any[] = [];
    if (fortuneWheelGiftIds && fortuneWheelGiftIds.length > 0) {
      const gifts = user.fortuneWheelGifts?.filter(g => 
        fortuneWheelGiftIds.includes(g._id.toString()) &&
        (!g.expiryDate || new Date(g.expiryDate) > new Date()) &&
        !g.isUsed
      ) || [];

      for (const gift of gifts) {
        appliedGifts.push({
          giftId: gift._id,
          description: gift.description,
          discount: gift.discountPercent || 0
        });
        // Mark gift as used
        gift.isUsed = true;
      }
    }

    const giftDiscount = appliedGifts.reduce((sum, g) => sum + g.discount, 0);

    // Calculate shipping cost (simplified - should integrate CDEK API)
    const shippingCost = freeShipping ? 0 : 300; // Placeholder

    const totalDiscount = promoDiscount + personalDiscount + giftDiscount;
    const totalAmount = Math.max(0, subtotal - totalDiscount + shippingCost);

    // Create order
    const order = new Order({
      orderNumber: `SE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      user: userId,
      items: validatedItems,
      subtotal,
      shippingCost,
      totalAmount,
      shippingAddress,
      deliveryMethod,
      cdekOfficeCode,
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'pending' : 'awaiting_payment',
      status: 'pending',
      promoCode: promoCodeDoc?._id,
      promoDiscount,
      personalDiscount,
      fortuneWheelGifts: appliedGifts,
      contactMethod: contactMethod || user.preferredContactMethod || 'phone',
      notes
    });

    await order.save();

    // Update promo code usage
    if (promoCodeDoc) {
      promoCodeDoc.usedCount += 1;
      await promoCodeDoc.save();
    }

    // Update user Fortune Wheel gifts
    if (appliedGifts.length > 0) {
      await user.save();
    }

    // Update product stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        orderCount: 1,
        totalSpent: totalAmount
      },
      $setOnInsert: { shopCustomerSince: new Date() }
    });

    res.status(201).json({
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus
      },
      message: 'Заказ успешно создан'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Не удалось создать заказ' });
  }
});

/**
 * GET /api/shop/orders
 * Get user's orders (requires authentication)
 */
router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('items.product', 'name images')
        .lean(),
      Order.countDocuments({ user: userId })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Не удалось загрузить заказы' });
  }
});

/**
 * GET /api/shop/orders/:id
 * Get order details (requires authentication)
 */
router.get('/orders/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: userId
    })
      .populate('items.product', 'name images')
      .populate('promoCode', 'code description')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Не удалось загрузить заказ' });
  }
});

export default router;
