/**
 * Order Admin Routes - Order management
 * Requires admin authentication
 */

import express from 'express';
import Order from '../../models/Order.model';
import User from '../../models/User.model';
import Product from '../../models/Product.model';
import { authMiddleware, adminMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware, adminMiddleware);

/**
 * GET /api/admin/orders
 * Get all orders with filters
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentStatus,
      deliveryMethod,
      search,
      dateFrom,
      dateTo
    } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (deliveryMethod) {
      query.deliveryMethod = deliveryMethod;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .populate('items.product', 'name sku images')
        .populate('promoCode', 'code description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
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
 * GET /api/admin/orders/:id
 * Get order details
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone whatsappPhone viberPhone vkUserId preferredContactMethod')
      .populate('items.product', 'name sku images articleWB skuOzon')
      .populate('promoCode', 'code description discountType discountValue')
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

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус заказа' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const previousStatus = order.status;
    order.status = status;

    // Update timestamps
    if (status === 'shipped') {
      order.shippedAt = new Date();
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
      
      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }

      // Revert user stats
      await User.findByIdAndUpdate(order.user, {
        $inc: { 
          orderCount: -1,
          totalSpent: -order.totalAmount
        }
      });
    }

    // Add status change to history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      notes: notes || `Статус изменен с "${previousStatus}" на "${status}"`
    });

    if (notes) {
      order.notes = (order.notes ? order.notes + '\n\n' : '') + 
        `[${new Date().toISOString()}] ${notes}`;
    }

    await order.save();

    // TODO: Send notification to customer via preferred contact method

    res.json({
      order,
      message: 'Статус заказа обновлен'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Не удалось обновить статус заказа' });
  }
});

/**
 * PUT /api/admin/orders/:id/payment-status
 * Update payment status
 */
router.put('/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const validStatuses = ['awaiting_payment', 'pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: 'Недопустимый статус оплаты' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    order.paymentStatus = paymentStatus;

    if (paymentStatus === 'completed') {
      order.paidAt = new Date();
    }

    await order.save();

    res.json({
      order,
      message: 'Статус оплаты обновлен'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Не удалось обновить статус оплаты' });
  }
});

/**
 * PUT /api/admin/orders/:id/cdek
 * Update CDEK shipping info
 */
router.put('/:id/cdek', async (req, res) => {
  try {
    const { cdekOrderId, cdekBarcode, cdekTrackingNumber, cdekOfficeCode } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (order.deliveryMethod !== 'cdek') {
      return res.status(400).json({ error: 'Заказ не использует доставку СДЭК' });
    }

    if (cdekOrderId) order.cdekOrderId = cdekOrderId;
    if (cdekBarcode) order.cdekBarcode = cdekBarcode;
    if (cdekTrackingNumber) order.cdekTrackingNumber = cdekTrackingNumber;
    if (cdekOfficeCode) order.cdekOfficeCode = cdekOfficeCode;

    await order.save();

    res.json({
      order,
      message: 'Информация о доставке СДЭК обновлена'
    });
  } catch (error) {
    console.error('Error updating CDEK info:', error);
    res.status(500).json({ error: 'Не удалось обновить информацию СДЭК' });
  }
});

/**
 * GET /api/admin/orders/stats/summary
 * Get order statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateFilter: any = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom as string);
    if (dateTo) dateFilter.$lte = new Date(dateTo as string);

    const query = dateFrom || dateTo ? { createdAt: dateFilter } : {};

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue
    ] = await Promise.all([
      Order.countDocuments(query),
      Order.countDocuments({ ...query, status: 'pending' }),
      Order.countDocuments({ ...query, status: 'delivered' }),
      Order.countDocuments({ ...query, status: 'cancelled' }),
      Order.aggregate([
        { $match: { ...query, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { ...query, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ])
    ]);

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue: averageOrderValue[0]?.avg || 0
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Не удалось загрузить статистику' });
  }
});

/**
 * GET /api/admin/orders/stats/by-status
 * Get orders grouped by status
 */
router.get('/stats/by-status', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching status stats:', error);
    res.status(500).json({ error: 'Не удалось загрузить статистику' });
  }
});

/**
 * POST /api/admin/orders/:id/refund
 * Process refund
 */
router.post('/:id/refund', async (req, res) => {
  try {
    const { reason, refundAmount } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    if (order.status === 'refunded') {
      return res.status(400).json({ error: 'Заказ уже возвращен' });
    }

    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({ error: 'Можно вернуть только оплаченные заказы' });
    }

    order.status = 'refunded';
    order.paymentStatus = 'refunded';
    order.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      notes: `Возврат: ${reason || 'Не указан'}. Сумма: ${refundAmount || order.totalAmount}₽`
    });

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    // Revert user stats
    await User.findByIdAndUpdate(order.user, {
      $inc: { 
        totalSpent: -(refundAmount || order.totalAmount)
      }
    });

    await order.save();

    // TODO: Process actual refund via Alfabank API

    res.json({
      order,
      message: 'Возврат успешно обработан'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Не удалось обработать возврат' });
  }
});

export default router;
