// services/notificationManager.js
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
            const user = await User.findById(notification.recipient);

            if (!user) {
                throw new Error('User not found');
            }

            let result;

            // Convert metadata to object if it's not already
            const metadata = notification.metadata instanceof Map || Array.isArray(notification.metadata)
                ? Object.fromEntries(notification.metadata)
                : notification.metadata;

            switch (notification.type) {
                case 'email':
                    if (user.notificationPreferences.email.enabled) {
                        result = await EmailService.sendCustomNotification(
                            user,
                            notification.title,
                            notification.message,
                            metadata
                        );
                    } else {
                        result = { success: false, message: 'Email notifications disabled by user' };
                    }
                    break;

                case 'push':
                    result = await PushNotificationService.sendToUser(
                        notification.recipient,
                        notification.title,
                        notification.message,
                        metadata
                    );
                    break;

                default:
                    result = { success: false, error: `Unsupported notification type: ${notification.type}` };
            }

            if (result.success) {
                await notification.markAsSent();
            } else {
                await this.handleFailedNotification(notification, result.error);
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
            if (notification.save && typeof notification.save === 'function') {
                if (notification.retryCount < 3) {
                    notification.status = 'pending';
                    notification.retryCount += 1;
                    // Schedule retry with exponential backoff
                    const retryDelay = Math.pow(2, notification.retryCount) * 5 * 60 * 1000; // 5min, 10min, 20min
                    notification.scheduledFor = new Date(Date.now() + retryDelay);
                    await notification.save();
                } else {
                    notification.status = 'failed';
                    await notification.save();
                }
            } else {
                console.error('Notification object is not a Mongoose document:', notification);
                // Handle the case where notification is not a proper document
                if (notification._id) {
                    // If it has an ID but isn't a document, try to fetch and update
                    const freshNotification = await Notification.findById(notification._id);
                    if (freshNotification) {
                        if (freshNotification.retryCount < 3) {
                            freshNotification.status = 'pending';
                            freshNotification.retryCount += 1;
                            const retryDelay = Math.pow(2, freshNotification.retryCount) * 5 * 60 * 1000;
                            freshNotification.scheduledFor = new Date(Date.now() + retryDelay);
                            await freshNotification.save();
                        } else {
                            freshNotification.status = 'failed';
                            await freshNotification.save();
                        }
                    }
                }
            }
        } catch (saveError) {
            console.error('Error saving failed notification:', saveError);
        }
    }

    // Specific notification creators
    async notifyCourseEnrollment(userId, course) {
        const user = await User.findById(userId);

        // Email notification
        if (user.notificationPreferences.email.enabled &&
            user.notificationPreferences.email.courseUpdates) {
            await EmailService.sendCourseEnrollmentEmail(user, course);
        }

        // Push notification
        if (user.notificationPreferences.push.enabled &&
            user.notificationPreferences.push.courseUpdates) {
            await PushNotificationService.sendToUser(
                userId,
                'Course Enrollment',
                `You've enrolled in ${course.title}`,
                { courseId: course._id.toString(), type: 'course_enrollment' }
            );
        }

        // Create notification record
        return this.createNotification({
            recipient: userId,
            type: 'push', // Primary type for record
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

        // Send email notifications (in a real app, you might want to batch these)
        for (const user of users) {
            if (user.notificationPreferences.email.enabled &&
                user.notificationPreferences.email.newContent) {
                // In a production environment, you might use a job queue for this
                await EmailService.sendCustomNotification(
                    user,
                    `New Course: ${course.title}`,
                    `A new course "${course.title}" is now available. ${course.shortDescription}`,
                    {
                        actionUrl: `${process.env.CLIENT_URL}/course/${course._id}`,
                        actionText: 'View Course'
                    }
                );
            }
        }

        // Send push notifications
        for (const user of users) {
            if (user.notificationPreferences.push.enabled &&
                user.notificationPreferences.push.newContent) {
                await PushNotificationService.sendToUser(
                    user._id,
                    'New Course Available',
                    course.title,
                    {
                        courseId: course._id.toString(),
                        type: 'new_course'
                    }
                );
            }
        }

        console.log(`Notified ${users.length} users about new course: ${course.title}`);
        return users.length;
    }

    async notifyCourseUpdate(course, updateDetails) {
        // Notify enrolled students about course updates
        const enrolledUserIds = course.studentsEnrolled;

        for (const userId of enrolledUserIds) {
            const user = await User.findById(userId);

            if (user && user.notificationPreferences.email.enabled &&
                user.notificationPreferences.email.courseUpdates) {
                await EmailService.sendCustomNotification(
                    user,
                    `Course Updated: ${course.title}`,
                    `The course "${course.title}" has been updated: ${updateDetails}`,
                    {
                        actionUrl: `${process.env.CLIENT_URL}/course/${course._id}`,
                        actionText: 'View Updates'
                    }
                );
            }

            if (user && user.notificationPreferences.push.enabled &&
                user.notificationPreferences.push.courseUpdates) {
                await PushNotificationService.sendToUser(
                    userId,
                    'Course Updated',
                    `${course.title} has been updated`,
                    {
                        courseId: course._id.toString(),
                        type: 'course_update'
                    }
                );
            }
        }
        console.log(`Notified ${enrolledUserIds.length} students about course update: ${course.title}`);
        return enrolledUserIds.length;
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
}

export default new NotificationManager();