import { Router, Response } from 'express';
import Tag from '../models/Tag.model';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all tags
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Фильтруем только видимые теги (по умолчанию isVisible = true)
    const tags = await Tag.find({ 
      $or: [
        { isVisible: { $ne: false } },
        { isVisible: { $exists: false } }
      ]
    }).sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create tag
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    // Create slug from name
    let slug = name.toLowerCase()
      .trim()
      .replace(/[а-яё]/g, (char: string) => {
        const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
        const en = 'abvgdeejzijklmnoprstufhccss_y_eua';
        const index = ru.indexOf(char);
        return index >= 0 ? en[index] : char;
      })
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists and add number if needed
    let finalSlug = slug;
    let counter = 1;
    while (await Tag.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const tag = new Tag({ 
      name: name.trim(), 
      slug: finalSlug, 
      color: color || '#3B82F6' 
    });
    await tag.save();
    
    res.status(201).json(tag);
  } catch (error: any) {
    console.error('Create tag error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Delete tag
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
