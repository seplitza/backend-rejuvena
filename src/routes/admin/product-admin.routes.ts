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
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      stock,
      category,
      images,
      isActive,
      isFeatured,
      // General info
      brand,
      manufacturer,
      countryOfOrigin,
      barcode,
      vendorCode,
      weight,
      dimensions,
      characteristics,
      // Marketplaces
      wildberries,
      ozon,
      yandexMarket,
      avito,
      // SEO and metadata
      metadata,
      seo,
      tags
    } = req.body;

    // Validate required fields
    if (!sku || !name || !slug || price === undefined) {
      return res.status(400).json({ 
        error: 'Обязательные поля: артикул (sku), название (name), slug, цена (price)' 
      });
    }

    // Check SKU uniqueness
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ error: 'Товар с таким артикулом уже существует' });
    }

    // Check slug uniqueness
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({ error: 'Товар с таким slug уже существует' });
    }

    // Validate category if provided
    if (category) {
      const categoryDoc = await ProductCategory.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ error: 'Категория не найдена' });
      }
    }

    // Create product
    const product = new Product({
      sku,
      name,
      slug,
      description: description || '',
      shortDescription: shortDescription || '',
      price,
      compareAtPrice,
      stock: stock || 0,
      category,
      images: images || [],
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      brand,
      manufacturer,
      countryOfOrigin,
      barcode,
      vendorCode,
      weight,
      dimensions,
      characteristics: characteristics || [],
      wildberries,
      ozon,
      yandexMarket,
      avito,
      metadata,
      seo,
      tags: tags || [],
      isBundle: false,
      bundleItems: []
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
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const {
      sku,
      name,
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      stock,
      category,
      images,
      isActive,
      isFeatured,
      brand,
      manufacturer,
      countryOfOrigin,
      barcode,
      vendorCode,
      weight,
      dimensions,
      characteristics,
      wildberries,
      ozon,
      yandexMarket,
      avito,
      metadata,
      seo,
      tags
    } = req.body;

    // Check SKU uniqueness (if changed)
    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ error: 'Товар с таким артикулом уже существует' });
      }
    }

    // Check slug uniqueness (if changed)
    if (slug && slug !== product.slug) {
      const existingSlug = await Product.findOne({ slug });
      if (existingSlug) {
        return res.status(400).json({ error: 'Товар с таким slug уже существует' });
      }
    }

    // Validate category (if changed)
    if (category && category !== product.category?.toString()) {
      const categoryDoc = await ProductCategory.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ error: 'Категория не найдена' });
      }
    }

    // Update fields
    if (sku !== undefined) product.sku = sku;
    if (name !== undefined) product.name = name;
    if (slug !== undefined) product.slug = slug;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (price !== undefined) product.price = price;
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
    if (stock !== undefined) product.stock = stock;
    if (category !== undefined) product.category = category;
    if (images !== undefined) product.images = images;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (brand !== undefined) product.brand = brand;
    if (manufacturer !== undefined) product.manufacturer = manufacturer;
    if (countryOfOrigin !== undefined) product.countryOfOrigin = countryOfOrigin;
    if (barcode !== undefined) product.barcode = barcode;
    if (vendorCode !== undefined) product.vendorCode = vendorCode;
    if (weight !== undefined) product.weight = weight;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (characteristics !== undefined) product.characteristics = characteristics;
    if (wildberries !== undefined) product.wildberries = wildberries;
    if (ozon !== undefined) product.ozon = ozon;
    if (yandexMarket !== undefined) product.yandexMarket = yandexMarket;
    if (avito !== undefined) product.avito = avito;
    if (metadata !== undefined) product.metadata = metadata;
    if (seo !== undefined) product.seo = seo;
    if (tags !== undefined) product.tags = tags;
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
