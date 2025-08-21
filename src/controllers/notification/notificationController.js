
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import NotificationManager from '../../services/notification/notificationManager.js';
import EmailService from '../../services/email/emailService.js';

// Get user notifications
const getUserNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status, category } = req.query;
        const userId = req.user.id;

        const query = { recipient: userId };
        if (type) query.type = type;
        if (status) query.status = status;
        if (category) query.category = category;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(query);

        res.status(200).json({
            notifications,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.countDocuments({
            recipient: userId,
            status: 'unread'
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error fetching unread count' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({ _id: id, recipient: userId });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.markAsRead();
        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error marking notification as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Notification.updateMany(
            { recipient: userId, status: 'unread' },
            { status: 'read', readAt: new Date() }
        );

        res.status(200).json({
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error marking all notifications as read' });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await Notification.findOneAndDelete({ _id: id, recipient: userId });

        if (!result) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
};

// Clear all notifications
const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Notification.deleteMany({ recipient: userId });

        res.status(200).json({
            message: `${result.deletedCount} notifications cleared`
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ message: 'Server error clearing notifications' });
    }
};

// Get notification preferences
const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('notificationPreferences quietHours emailFrequency');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            notificationPreferences: user.notificationPreferences,
            quietHours: user.quietHours,
            emailFrequency: user.emailFrequency
        });
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ message: 'Server error fetching notification preferences' });
    }
};

// Update notification preferences
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationPreferences, quietHours, emailFrequency } = req.body;

        const updateData = {};
        if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;
        if (quietHours) updateData.quietHours = quietHours;
        if (emailFrequency) updateData.emailFrequency = emailFrequency;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: 'Notification preferences updated successfully',
            preferences: {
                notificationPreferences: user.notificationPreferences,
                quietHours: user.quietHours,
                emailFrequency: user.emailFrequency
            }
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ message: 'Server error updating notification preferences' });
    }
};

// Send test notification
const sendTestNotification = async (req, res) => {
    try {
        const { type, category } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let notification;

        if (type === 'email') {
            // Send test email
            await EmailService.sendCustomNotification(
                user,
                'Test Notification',
                'This is a test notification to verify your email settings are working correctly.',
                {
                    actionUrl: `${process.env.CLIENT_URL}/notifications`,
                    actionText: 'View Notifications'
                }
            );

            // Create notification record
            notification = await NotificationManager.createNotification({
                recipient: userId,
                type: 'email',
                title: 'Test Email Notification',
                message: 'This is a test email notification',
                category: category || 'system',
                metadata: {
                    test: 'true',
                    actionUrl: `${process.env.CLIENT_URL}/notifications`
                }
            });
        } else if (type === 'push') {
            // Send test push notification
            await NotificationManager.sendNotification({
                recipient: userId,
                type: 'push',
                title: 'Test Push Notification',
                message: 'This is a test push notification',
                category: category || 'system',
                metadata: {
                    test: 'true',
                    type: 'test_notification'
                }
            });

            // For push, we create the record in the sendNotification method
            notification = { message: 'Push test initiated' };
        } else {
            return res.status(400).json({ message: 'Invalid notification type' });
        }

        res.status(200).json({
            message: 'Test notification sent successfully',
            notification
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ message: 'Server error sending test notification' });
    }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Count by type
        const byType = await Notification.aggregate([
            {
                $match: {
                    recipient: mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } }
                }
            }
        ]);

        // Count by category
        const byCategory = await Notification.aggregate([
            {
                $match: {
                    recipient: mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Daily count for the chart
        const dailyStats = await Notification.aggregate([
            {
                $match: {
                    recipient: mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            byType,
            byCategory,
            dailyStats,
            totalDays: days
        });
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({ message: 'Server error fetching notification statistics' });
    }
};

// Register push token
const registerPushToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, platform = 'web' } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if token already exists
        const existingTokenIndex = user.pushTokens.findIndex(t => t.token === token);

        if (existingTokenIndex === -1) {
            user.pushTokens.push({ token, platform });
        } else {
            // Update platform if token exists
            user.pushTokens[existingTokenIndex].platform = platform;
        }

        await user.save();

        res.status(200).json({ message: 'Push token registered successfully' });
    } catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({ message: 'Server error registering push token' });
    }
};

// Unregister push token
const unregisterPushToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.pushTokens = user.pushTokens.filter(t => t.token !== token);
        await user.save();

        res.status(200).json({ message: 'Push token unregistered successfully' });
    } catch (error) {
        console.error('Error unregistering push token:', error);
        res.status(500).json({ message: 'Server error unregistering push token' });
    }
};

export {
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
};