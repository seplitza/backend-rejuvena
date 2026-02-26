/**
 * Product Admin Routes - CRUD for products
 * Requires admin authentication
 */

import express from 'express';
import Product from '../../models/Product.model';
import ProductCategory from '../../models/ProductCategory.model';
import MarketplacePrice from '../../models/MarketplacePrice.model';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, adminMiddleware);

/**
 * GET /api/admin/products
 * Get all products (including inactive)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, categoryId, search, isActive } = req.query;

    const query: any = {};

    if (categoryId) {
      query.category = categoryId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('bundleItems.product', 'name price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
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
 * GET /api/admin/products/:id
 * Get single product
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('bundleItems.product', 'name price images')
      .lean();

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Fetch marketplace price history
    const priceHistory = await MarketplacePrice.find({
      product: product._id
    })
      .sort({ fetchedAt: -1 })
      .limit(100)
      .lean();

    res.json({
      ...product,
      priceHistory
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Не удалось загрузить товар' });
  }
});

/**
 * POST /api/admin/products
 * Create new product
 */
router.post('/', async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      price,
      oldPrice,
      stock,
      category,
      images,
      articleWB,
      skuOzon,
      isBundle,
      bundleItems,
      weight,
      dimensions,
      manufacturer,
      countryOfOrigin,
      tags,
      seo,
      isActive
    } = req.body;

    // Validate required fields
    if (!sku || !name || !price || !category) {
      return res.status(400).json({ 
        error: 'Обязательные поля: артикул, название, цена, категория' 
      });
    }

    // Check SKU uniqueness
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ error: 'Товар с таким артикулом уже существует' });
    }

    // Validate category
    const categoryDoc = await ProductCategory.findOne({ _id: category, isActive: true });
    if (!categoryDoc) {
      return res.status(400).json({ error: 'Категория не найдена' });
    }

    // Create product
    const product = new Product({
      sku,
      name,
      description,
      price,
      oldPrice,
      stock: stock || 0,
      category,
      images: images || [],
      articleWB,
      skuOzon,
      isBundle: isBundle || false,
      bundleItems: bundleItems || [],
      weight,
      dimensions,
      manufacturer,
      countryOfOrigin,
      tags: tags || [],
      seo,
      isActive: isActive !== undefined ? isActive : true
    });

    await product.save();

    res.status(201).json({
      product,
      message: 'Товар успешно создан'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Не удалось создать товар' });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update product
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      price,
      oldPrice,
      stock,
      category,
      images,
      articleWB,
      skuOzon,
      isBundle,
      bundleItems,
      weight,
      dimensions,
      manufacturer,
      countryOfOrigin,
      tags,
      seo,
      isActive
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Check SKU uniqueness (if changed)
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ error: 'Товар с таким артикулом уже существует' });
      }
    }

    // Validate category (if changed)
    if (category && category !== product.category.toString()) {
      const categoryDoc = await ProductCategory.findOne({ _id: category, isActive: true });
      if (!categoryDoc) {
        return res.status(400).json({ error: 'Категория не найдена' });
      }
    }

    // Update fields
    if (sku) product.sku = sku;
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (oldPrice !== undefined) product.oldPrice = oldPrice;
    if (stock !== undefined) product.stock = stock;
    if (category) product.category = category;
    if (images) product.images = images;
    if (articleWB !== undefined) product.articleWB = articleWB;
    if (skuOzon !== undefined) product.skuOzon = skuOzon;
    if (isBundle !== undefined) product.isBundle = isBundle;
    if (bundleItems) product.bundleItems = bundleItems;
    if (weight !== undefined) product.weight = weight;
    if (dimensions) product.dimensions = dimensions;
    if (manufacturer !== undefined) product.manufacturer = manufacturer;
    if (countryOfOrigin !== undefined) product.countryOfOrigin = countryOfOrigin;
    if (tags) product.tags = tags;
    if (seo) product.seo = seo;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    res.json({
      product,
      message: 'Товар успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Не удалось обновить товар' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete product (soft delete - set isActive = false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Не удалось удалить товар' });
  }
});

/**
 * POST /api/admin/products/:id/restore
 * Restore deleted product
 */
router.post('/:id/restore', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    product.isActive = true;
    await product.save();

    res.json({ 
      product,
      message: 'Товар успешно восстановлен' 
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({ error: 'Не удалось восстановить товар' });
  }
});

/**
 * POST /api/admin/products/bulk-update
 * Bulk update products (change category, activate/deactivate, adjust prices)
 */
router.post('/bulk-update', async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ error: 'Не выбраны товары' });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updates }
    );

    res.json({
      message: `Обновлено товаров: ${result.modifiedCount}`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating products:', error);
    res.status(500).json({ error: 'Не удалось обновить товары' });
  }
});

/**
 * GET /api/admin/products/:id/marketplace-prices
 * Get marketplace price history for product
 */
router.get('/:id/marketplace-prices', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const prices = await MarketplacePrice.find({
      product: req.params.id,
      fetchedAt: { $gte: startDate }
    })
      .sort({ fetchedAt: -1 })
      .lean();

    // Group by marketplace
    const pricesByMarketplace: any = {
      wildberries: [],
      ozon: []
    };

    prices.forEach(price => {
      if (price.marketplace === 'wildberries') {
        pricesByMarketplace.wildberries.push({
          price: price.price,
          fetchedAt: price.fetchedAt
        });
      } else if (price.marketplace === 'ozon') {
        pricesByMarketplace.ozon.push({
          price: price.price,
          fetchedAt: price.fetchedAt
        });
      }
    });

    res.json(pricesByMarketplace);
  } catch (error) {
    console.error('Error fetching marketplace prices:', error);
    res.status(500).json({ error: 'Не удалось загрузить историю цен' });
  }
});

export default router;
