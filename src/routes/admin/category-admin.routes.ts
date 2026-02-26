/**
 * Category Admin Routes - Manage product categories
 * Requires admin authentication
 */

import express from 'express';
import ProductCategory from '../../models/ProductCategory.model';
import Product from '../../models/Product.model';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, adminMiddleware);

/**
 * GET /api/admin/categories
 * Get all categories
 */
router.get('/', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const categories = await ProductCategory.find(query)
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Count products per category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category: any) => {
        const productCount = await Product.countDocuments({ 
          category: category._id,
          isActive: true
        });

        return {
          ...category,
          productCount
        };
      })
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Не удалось загрузить категории' });
  }
});

/**
 * GET /api/admin/categories/:id
 * Get single category
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id)
      .populate('parentCategory', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Get subcategories
    const subcategories = await ProductCategory.find({ 
      parentCategory: category._id,
      isActive: true
    }).lean();

    // Count products
    const productCount = await Product.countDocuments({ 
      category: category._id,
      isActive: true
    });

    res.json({
      ...category,
      subcategories,
      productCount
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Не удалось загрузить категорию' });
  }
});

/**
 * POST /api/admin/categories
 * Create new category
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      parentCategory,
      imageUrl,
      sortOrder,
      seo,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({ error: 'Обязательные поля: название, slug' });
    }

    // Check slug uniqueness
    const existingCategory = await ProductCategory.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({ error: 'Категория с таким slug уже существует' });
    }

    // Validate parent category
    if (parentCategory) {
      const parent = await ProductCategory.findOne({ _id: parentCategory, isActive: true });
      if (!parent) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }
    }

    // Create category
    const category = new ProductCategory({
      name,
      slug,
      description,
      parentCategory,
      imageUrl,
      sortOrder: sortOrder || 0,
      seo,
      isActive: isActive !== undefined ? isActive : true
    });

    await category.save();

    res.status(201).json({
      category,
      message: 'Категория успешно создана'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Не удалось создать категорию' });
  }
});

/**
 * PUT /api/admin/categories/:id
 * Update category
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      parentCategory,
      imageUrl,
      sortOrder,
      seo,
      isActive
    } = req.body;

    const category = await ProductCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Check slug uniqueness (if changed)
    if (slug && slug !== category.slug) {
      const existingCategory = await ProductCategory.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({ error: 'Категория с таким slug уже существует' });
      }
    }

    // Prevent circular parent reference
    if (parentCategory && parentCategory === req.params.id) {
      return res.status(400).json({ error: 'Категория не может быть родительской сама себе' });
    }

    // Validate parent category
    if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
      const parent = await ProductCategory.findOne({ _id: parentCategory, isActive: true });
      if (!parent) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || undefined;
    if (imageUrl !== undefined) category.imageUrl = imageUrl;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (seo) category.seo = seo;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      category,
      message: 'Категория успешно обновлена'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Не удалось обновить категорию' });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Delete category (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ 
      category: category._id,
      isActive: true
    });

    if (productCount > 0) {
      return res.status(400).json({ 
        error: `Невозможно удалить категорию: ${productCount} активных товаров` 
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await ProductCategory.countDocuments({ 
      parentCategory: category._id,
      isActive: true
    });

    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        error: `Невозможно удалить категорию: ${subcategoryCount} подкатегорий` 
      });
    }

    category.isActive = false;
    await category.save();

    res.json({ message: 'Категория успешно удалена' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Не удалось удалить категорию' });
  }
});

/**
 * POST /api/admin/categories/:id/restore
 * Restore deleted category
 */
router.post('/:id/restore', async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    category.isActive = true;
    await category.save();

    res.json({ 
      category,
      message: 'Категория успешно восстановлена' 
    });
  } catch (error) {
    console.error('Error restoring category:', error);
    res.status(500).json({ error: 'Не удалось восстановить категорию' });
  }
});

/**
 * PUT /api/admin/categories/reorder
 * Reorder categories (bulk update sortOrder)
 */
router.put('/reorder', async (req, res) => {
  try {
    const { categories } = req.body; // [{ id, sortOrder }]

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'Неверный формат данных' });
    }

    const updatePromises = categories.map(({ id, sortOrder }: any) =>
      ProductCategory.findByIdAndUpdate(id, { sortOrder })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Порядок категорий обновлен' });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Не удалось изменить порядок категорий' });
  }
});

export default router;
