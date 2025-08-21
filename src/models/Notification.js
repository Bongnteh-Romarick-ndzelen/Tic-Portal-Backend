import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'push', 'in-app'],
        required: true
    },
    category: {
        type: String,
        enum: ['course', 'internship', 'system', 'security', 'announcement'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'read', 'unread'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    relatedEntity: {
        type: String // 'Course', 'Internship', etc.
    },
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    sentAt: {
        type: Date
    },
    readAt: {
        type: Date
    },
    retryCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    indexes: [
        { recipient: 1, status: 1 },
        { type: 1, status: 1 },
        { createdAt: -1 }
    ]
});

// Mark as sent
notificationSchema.methods.markAsSent = function () {
    this.status = 'sent';
    this.sentAt = new Date();
    return this.save();
};

// Mark as read
notificationSchema.methods.markAsRead = function () {
    this.status = 'read';
    this.readAt = new Date();
    return this.save();
};

// Retry sending
notificationSchema.methods.retry = function () {
    this.retryCount += 1;
    this.status = 'pending';
    return this.save();
};

export default mongoose.model('Notification', notificationSchema);