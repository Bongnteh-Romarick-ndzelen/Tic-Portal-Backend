import Notification from '../../models/Notification.js';
import EmailService from '../email/emailService.js';
import PushNotificationService from './pushNotificationService.js';
import User from '../../models/User.js';

class NotificationManager {
    constructor() {
        this.channels = {
            email: EmailService,
            push: PushNotificationService
        };
    }

    async createNotification(data) {
        try {
            const notification = new Notification(data);
            await notification.save();

            // Send immediately if not scheduled for later
            if (!data.scheduledFor || new Date(data.scheduledFor) <= new Date()) {
                await this.sendNotification(notification);
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    async sendNotification(notification) {
        try {
            // Ensure we have a Mongoose document
            let notificationDoc = notification;
            if (!notification.save || typeof notification.save !== 'function') {
                notificationDoc = await Notification.findById(notification._id) || notification;
            }

            const user = await User.findById(notificationDoc.recipient);

            if (!user) {
                throw new Error('User not found');
            }

            let result;

            // Convert metadata to object if it's not already
            const metadata = this.safeConvertMetadata(notificationDoc.metadata);

            switch (notificationDoc.type) {
                case 'email':
                    if (user.notificationPreferences.email.enabled) {
                        result = await EmailService.sendCustomNotification(
                            user,
                            notificationDoc.title,
                            notificationDoc.message,
                            metadata
                        );
                    } else {
                        result = { success: false, message: 'Email notifications disabled by user' };
                    }
                    break;

                case 'push':
                    // Check if user has valid push tokens before attempting to send
                    const hasValidTokens = user.pushTokens && user.pushTokens.some(token =>
                        token && typeof token === 'string' && token.length > 0
                    );

                    if (hasValidTokens) {
                        result = await PushNotificationService.sendToUser(
                            notificationDoc.recipient,
                            notificationDoc.title,
                            notificationDoc.message,
                            metadata
                        );
                    } else {
                        result = {
                            success: false,
                            message: 'No valid push tokens found for user',
                            error: 'No valid device tokens'
                        };
                    }
                    break;

                default:
                    result = { success: false, error: `Unsupported notification type: ${notificationDoc.type}` };
            }

            if (result.success) {
                if (notificationDoc.markAsSent && typeof notificationDoc.markAsSent === 'function') {
                    await notificationDoc.markAsSent();
                }
            } else {
                await this.handleFailedNotification(notificationDoc, result.error || result.message);
            }

            return result;
        } catch (error) {
            console.error('Error sending notification:', error);
            await this.handleFailedNotification(notification, error.message);
            return { success: false, error: error.message };
        }
    }

    async handleFailedNotification(notification, error) {
        try {
            // Make sure we're working with a Mongoose document
            let notificationDoc = notification;
            if (!notification.save || typeof notification.save !== 'function') {
                // Try to fetch the document if we have an ID
                if (notification._id) {
                    notificationDoc = await Notification.findById(notification._id);
                }
            }

            if (notificationDoc && notificationDoc.save && typeof notificationDoc.save === 'function') {
                if (notificationDoc.retryCount < 3) {
                    notificationDoc.status = 'pending';
                    notificationDoc.retryCount += 1;
                    // Schedule retry with exponential backoff
                    const retryDelay = Math.pow(2, notificationDoc.retryCount) * 5 * 60 * 1000; // 5min, 10min, 20min
                    notificationDoc.scheduledFor = new Date(Date.now() + retryDelay);
                    await notificationDoc.save();
                } else {
                    notificationDoc.status = 'failed';
                    notificationDoc.errorMessage = error?.message || error || 'Unknown error';
                    await notificationDoc.save();
                }
            } else {
                console.warn('Could not save failed notification - not a Mongoose document:', notification);
            }
        } catch (saveError) {
            console.error('Error saving failed notification:', saveError);
        }
    }

    // Specific notification creators
    async notifyCourseEnrollment(userId, course) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Email notification
        if (user.notificationPreferences.email.enabled &&
            user.notificationPreferences.email.courseUpdates) {
            await EmailService.sendCourseEnrollmentEmail(user, course);
        }

        // Push notification - only send if user has valid tokens
        if (user.notificationPreferences.push.enabled &&
            user.notificationPreferences.push.courseUpdates &&
            user.pushTokens && user.pushTokens.length > 0) {

            const hasValidTokens = user.pushTokens.some(token =>
                token && typeof token === 'string' && token.length > 0
            );

            if (hasValidTokens) {
                await PushNotificationService.sendToUser(
                    userId,
                    'Course Enrollment',
                    `You've enrolled in ${course.title}`,
                    { courseId: course._id.toString(), type: 'course_enrollment' }
                );
            }
        }

        // Create notification record
        return this.createNotification({
            recipient: userId,
            type: 'push',
            title: 'Course Enrollment',
            message: `You've enrolled in ${course.title}`,
            category: 'course',
            metadata: {
                courseId: course._id.toString(),
                courseTitle: course.title,
                actionUrl: `${process.env.CLIENT_URL}/course/${course._id}`
            }
        });
    }

    async notifyNewCourseAvailable(course, targetUserTypes = ['student']) {
        // Find users who should receive this notification
        const users = await User.find({
            userType: { $in: targetUserTypes },
            'notificationPreferences.email.newContent': true,
            isVerified: true
        });

        let emailCount = 0;
        let pushCount = 0;

        // Send email notifications
        for (const user of users) {
            if (user.notificationPreferences.email.enabled &&
                user.notificationPreferences.email.newContent) {
                try {
                    await EmailService.sendCustomNotification(
                        user,
                        `New Course: ${course.title}`,
                        `A new course "${course.title}" is now available. ${course.shortDescription}`,
                        {
                            actionUrl: `${process.env.CLIENT_URL}/course/${course._id}`,
                            actionText: 'View Course'
                        }
                    );
                    emailCount++;
                } catch (error) {
                    console.error(`Failed to send email to ${user.email}:`, error);
                }
            }
        }

        // Send push notifications - only to users with valid tokens
        for (const user of users) {
            if (user.notificationPreferences.push.enabled &&
                user.notificationPreferences.push.newContent &&
                user.pushTokens && user.pushTokens.length > 0) {

                const hasValidTokens = user.pushTokens.some(token =>
                    token && typeof token === 'string' && token.length > 0
                );

                if (hasValidTokens) {
                    try {
                        await PushNotificationService.sendToUser(
                            user._id,
                            'New Course Available',
                            course.title,
                            {
                                courseId: course._id.toString(),
                                type: 'new_course'
                            }
                        );
                        pushCount++;
                    } catch (error) {
                        console.error(`Failed to send push to user ${user._id}:`, error);
                    }
                }
            }
        }

        console.log(`Notified ${emailCount} users via email and ${pushCount} users via push about new course: ${course.title}`);
        return { emailCount, pushCount };
    }

    async notifyCourseUpdate(course, updateDetails) {
        // Notify enrolled students about course updates
        const enrolledUserIds = course.studentsEnrolled;
        let emailCount = 0;
        let pushCount = 0;

        for (const userId of enrolledUserIds) {
            const user = await User.findById(userId);

            if (user) {
                // Email notification
                if (user.notificationPreferences.email.enabled &&
                    user.notificationPreferences.email.courseUpdates) {
                    try {
                        await EmailService.sendCustomNotification(
                            user,
                            `Course Updated: ${course.title}`,
                            `The course "${course.title}" has been updated: ${updateDetails}`,
                            {
                                actionUrl: `${process.env.CLIENT_URL}/course/${course._id}`,
                                actionText: 'View Updates'
                            }
                        );
                        emailCount++;
                    } catch (error) {
                        console.error(`Failed to send email to ${user.email}:`, error);
                    }
                }

                // Push notification - only if user has valid tokens
                if (user.notificationPreferences.push.enabled &&
                    user.notificationPreferences.push.courseUpdates &&
                    user.pushTokens && user.pushTokens.length > 0) {

                    const hasValidTokens = user.pushTokens.some(token =>
                        token && typeof token === 'string' && token.length > 0
                    );

                    if (hasValidTokens) {
                        try {
                            await PushNotificationService.sendToUser(
                                userId,
                                'Course Updated',
                                `${course.title} has been updated`,
                                {
                                    courseId: course._id.toString(),
                                    type: 'course_update'
                                }
                            );
                            pushCount++;
                        } catch (error) {
                            console.error(`Failed to send push to user ${userId}:`, error);
                        }
                    }
                }
            }
        }

        console.log(`Notified ${emailCount} students via email and ${pushCount} students via push about course update: ${course.title}`);
        return { emailCount, pushCount };
    }

    // Utility method to safely convert metadata
    safeConvertMetadata(metadata) {
        if (!metadata) return {};

        if (metadata instanceof Map || Array.isArray(metadata)) {
            return Object.fromEntries(metadata);
        }

        if (typeof metadata === 'object') {
            return metadata;
        }

        try {
            return JSON.parse(metadata);
        } catch {
            return {};
        }
    }

    // Method to clean up invalid push tokens
    async cleanupInvalidPushTokens(userId, invalidToken = null) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.pushTokens) return;

            if (invalidToken) {
                // Remove specific invalid token
                user.pushTokens = user.pushTokens.filter(token => token !== invalidToken);
            } else {
                // Remove all empty/invalid tokens
                user.pushTokens = user.pushTokens.filter(token =>
                    token && typeof token === 'string' && token.length > 0
                );
            }

            await user.save();
            console.log(`Cleaned up push tokens for user ${userId}`);
        } catch (error) {
            console.error('Error cleaning up push tokens:', error);
        }
    }
}

export default new NotificationManager();