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

// Notification management
router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/stats', getNotificationStats);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

// Test endpoint
router.post('/test', sendTestNotification);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Push tokens
router.post('/push-tokens', registerPushToken);
router.delete('/push-tokens', unregisterPushToken);

export default router;