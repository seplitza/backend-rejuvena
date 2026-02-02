import { Router, Request, Response } from 'express';
import Landing from '../models/Landing.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ============ ADMIN ENDPOINTS (Protected) ============

// GET /api/landings - Получить все лендинги (для админки)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', published } = req.query;
    
    const query: any = {};
    
    // Фильтр по статусу публикации
    if (published !== undefined) {
      query.isPublished = published === 'true';
    }
    
    // Поиск по названию или slug
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [landings, total] = await Promise.all([
      Landing.find(query)
        .populate('createdBy', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Landing.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      landings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching landings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landings' 
    });
  }
});

// GET /api/landings/:id - Получить один лендинг по ID (для админки)
router.get('/admin/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const landing = await Landing.findById(req.params.id)
      .populate('createdBy', 'email firstName lastName')
      .populate('marathonsSection.basic.marathonId')
      .populate('marathonsSection.advanced.marathonId')
      .lean();
    
    if (!landing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Landing not found' 
      });
    }
    
    res.json({ success: true, landing });
  } catch (error) {
    console.error('Error fetching landing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landing' 
    });
  }
});

// POST /api/landings - Создать новый лендинг
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const landingData = {
      ...req.body,
      createdBy: req.userId
    };
    
    const landing = new Landing(landingData);
    await landing.save();
    
    res.status(201).json({ 
      success: true, 
      landing,
      message: 'Landing created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating landing:', error);
    
    // Проверка на дубликат slug
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Landing with this slug already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create landing' 
    });
  }
});

// PUT /api/landings/:id - Обновить лендинг
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Не позволяем изменить createdBy
    delete req.body.createdBy;
    
    const landing = await Landing.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!landing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Landing not found' 
      });
    }
    
    res.json({ 
      success: true, 
      landing,
      message: 'Landing updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating landing:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Landing with this slug already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update landing' 
    });
  }
});

// PATCH /api/landings/:id/publish - Опубликовать/снять с публикации
router.patch('/:id/publish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    
    const landing = await Landing.findByIdAndUpdate(
      id,
      { 
        isPublished,
        publishedAt: isPublished ? new Date() : undefined
      },
      { new: true }
    );
    
    if (!landing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Landing not found' 
      });
    }
    
    res.json({ 
      success: true, 
      landing,
      message: `Landing ${isPublished ? 'published' : 'unpublished'} successfully` 
    });
  } catch (error) {
    console.error('Error publishing landing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update landing status' 
    });
  }
});

// DELETE /api/landings/:id - Удалить лендинг
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const landing = await Landing.findByIdAndDelete(id);
    
    if (!landing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Landing not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Landing deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting landing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete landing' 
    });
  }
});

// ============ PUBLIC ENDPOINTS ============

// GET /api/landings/public/:slug - Получить опубликованный лендинг по slug
// GET /api/landings/public - Получить список всех опубликованных лендингов (для билда)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const landings = await Landing.find({ isPublished: true })
      .select('slug title')
      .lean();

    res.json({ 
      success: true, 
      landings 
    });
  } catch (error) {
    console.error('Error fetching public landings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch public landings' 
    });
  }
});

router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const landing = await Landing.findOne({ 
      slug, 
      isPublished: true 
    })
      .populate('marathonsSection.basic.marathonId', 'title numberOfDays cost')
      .populate('marathonsSection.advanced.marathonId', 'title numberOfDays cost')
      .lean();
    
    if (!landing) {
      return res.status(404).json({ 
        success: false, 
        error: 'Landing not found or not published' 
      });
    }
    
    // Увеличиваем счетчик просмотров
    await Landing.findByIdAndUpdate(landing._id, { 
      $inc: { views: 1 } 
    });
    
    res.json({ success: true, landing });
  } catch (error) {
    console.error('Error fetching public landing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch landing' 
    });
  }
});

// POST /api/landings/public/:slug/conversion - Зафиксировать конверсию
router.post('/public/:slug/conversion', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    await Landing.findOneAndUpdate(
      { slug, isPublished: true },
      { $inc: { conversions: 1 } }
    );
    
    res.json({ success: true, message: 'Conversion tracked' });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track conversion' 
    });
  }
});

export default router;
