// routes/notifications.js
import express from 'express';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getPreferences,
    updatePreferences,
    sendTestNotification,
    getNotificationStats,
    registerPushToken,
    unregisterPushToken
} from '../../controllers/notification/notificationController.js';
import { authenticate } from '../../middleware/auth.js';
const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, push, in-app]
 *         description: Filter by notification type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, read, unread]
 *         description: Filter by notification status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [course, internship, system, security, announcement]
 *         description: Filter by notification category
 *     responses:
 *       200:
 *         description: List of notifications
 *       500:
 *         description: Server error
 */
router.get('/', getUserNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 *       500:
 *         description: Server error
 */
router.get('/unread-count', getUnreadCount);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Notification statistics
 *       500:
 *         description: Server error
 */
router.get('/stats', getNotificationStats);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/read', markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Server error
 */
router.patch('/read-all', markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteNotification);

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: Clear all notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 *       500:
 *         description: Server error
 */
router.delete('/', clearAllNotifications);

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Send a test notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, push]
 *                 description: Type of notification to test
 *               category:
 *                 type: string
 *                 enum: [course, internship, system, security, announcement]
 *                 description: Category for the test notification
 *     responses:
 *       200:
 *         description: Test notification sent successfully
 *       400:
 *         description: Invalid notification type
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/test', sendTestNotification);


router.get('/preferences', getPreferences);

router.put('/preferences', updatePreferences);


router.post('/push-tokens', registerPushToken);

router.delete('/push-tokens', unregisterPushToken);

export default router;