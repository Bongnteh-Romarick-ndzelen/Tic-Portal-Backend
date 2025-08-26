// services/pushNotificationService.js
import admin from 'firebase-admin';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

class PushNotificationService {
    constructor() {
        this.initialized = false;
        this.initializeFirebase();
    }

    initializeFirebase() {
        try {
            if (admin.apps.length === 0) { // Check if already initialized
                const serviceAccount = {
                    type: "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token",
                    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
                };

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: process.env.FIREBASE_DATABASE_URL
                });

                this.initialized = true;
                console.log('Firebase Admin SDK initialized successfully');
            }
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            this.initialized = false;
        }
    }

    async sendToUser(userId, title, body, data = {}) {
        try {
            if (!this.initialized) {
                return { success: false, message: 'Firebase not initialized' };
            }

            const user = await User.findById(userId);
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Check user preferences
            if (user.notificationPreferences?.push?.enabled === false) {
                return { success: false, message: 'Push notifications disabled by user' };
            }

            // Check quiet hours
            if (this.isInQuietHours(user)) {
                return { success: false, message: 'In quiet hours - notification delayed' };
            }

            if (!user.pushTokens || user.pushTokens.length === 0) {
                return { success: false, message: 'No push tokens registered for user' };
            }

            const results = [];
            for (const tokenInfo of user.pushTokens) {
                const result = await this.sendToDevice(tokenInfo.token, title, body, data);
                results.push(result);

                // If token is invalid, remove it from user's profile
                if (result.error && this.isInvalidTokenError(result.error)) {
                    await this.removeInvalidToken(userId, tokenInfo.token);
                }
            }

            return {
                success: results.some(r => r.success),
                results,
                message: `Sent to ${results.filter(r => r.success).length} devices`
            };

        } catch (error) {
            console.error('Error sending push notification:', error);
            return { success: false, error: error.message };
        }
    }

    async sendToDevice(token, title, body, data = {}) {
        try {
            if (!this.initialized) {
                return { success: false, message: 'Firebase not initialized' };
            }

            const message = {
                notification: {
                    title: title,
                    body: body
                },
                data: {
                    ...data,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Flutter
                    // or for web: click_action: data.actionUrl || 'https://yourwebsite.com'
                },
                token: token,
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                android: {
                    notification: {
                        sound: 'default',
                        channel_id: 'default_channel'
                    }
                }
            };

            const response = await admin.messaging().send(message);
            console.log('Successfully sent FCM message:', response);

            return {
                success: true,
                response,
                messageId: response
            };

        } catch (error) {
            console.error('Error sending FCM message:', error);

            return {
                success: false,
                error: error.message,
                errorCode: error.code
            };
        }
    }

    async sendToTopic(topic, title, body, data = {}) {
        try {
            if (!this.initialized) {
                return { success: false, message: 'Firebase not initialized' };
            }

            const message = {
                notification: {
                    title: title,
                    body: body
                },
                data: data,
                topic: topic
            };

            const response = await admin.messaging().send(message);
            console.log('Successfully sent to topic:', topic, response);

            return {
                success: true,
                response,
                messageId: response
            };

        } catch (error) {
            console.error('Error sending to topic:', error);
            return { success: false, error: error.message };
        }
    }

    async sendMulticast(tokens, title, body, data = {}) {
        try {
            if (!this.initialized) {
                return { success: false, message: 'Firebase not initialized' };
            }

            const message = {
                notification: { title, body },
                data: data,
                tokens: tokens
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log('Multicast sent:', response.successCount + ' successful');

            return {
                success: response.successCount > 0,
                response: response,
                successful: response.successCount,
                failed: response.failureCount
            };

        } catch (error) {
            console.error('Error sending multicast:', error);
            return { success: false, error: error.message };
        }
    }

    isInvalidTokenError(error) {
        const invalidTokenErrors = [
            'messaging/invalid-registration-token',
            'messaging/registration-token-not-registered'
        ];
        return invalidTokenErrors.includes(error.code);
    }

    async removeInvalidToken(userId, invalidToken) {
        try {
            await User.findByIdAndUpdate(
                userId,
                { $pull: { pushTokens: { token: invalidToken } } }
            );
            console.log('Removed invalid token for user:', userId);
        } catch (error) {
            console.error('Error removing invalid token:', error);
        }
    }

    isInQuietHours(user) {
        if (!user.quietHours || !user.quietHours.enabled) {
            return false;
        }

        const now = new Date();
        const nowUTC = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
        const userOffset = user.timezoneOffset || 0;
        const userTime = new Date(nowUTC.getTime() + (userOffset * 60000));

        const [startHour, startMinute] = user.quietHours.start.split(':').map(Number);
        const [endHour, endMinute] = user.quietHours.end.split(':').map(Number);

        const userMinutes = userTime.getHours() * 60 + userTime.getMinutes();
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (startMinutes < endMinutes) {
            return userMinutes >= startMinutes && userMinutes < endMinutes;
        } else {
            return userMinutes >= startMinutes || userMinutes < endMinutes;
        }
    }
}

export default new PushNotificationService();