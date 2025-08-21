import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAILJS_HOST || 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAILJS_USER,
                pass: process.env.EMAILJS_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendWelcomeEmail(user) {
        const mailOptions = {
            from: process.env.EMAILJS_FROM_EMAIL || 'noreply@ticportal.com',
            to: user.email,
            subject: 'Welcome to TIC Portal!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Welcome to TIC Portal, ${user.fullName}!</h2>
                    <p>We're excited to have you on board. Your account has been successfully created.</p>
                    <p>Start exploring our courses and internship opportunities to enhance your skills and career.</p>
                    <a href="${process.env.CLIENT_URL}/dashboard/student"
                       style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                              color: white; text-decoration: none; border-radius: 4px; margin: 15px 0;">
                        Go to Dashboard
                    </a>
                    <p>If you have any questions, feel free to contact our support team.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #7f8c8d; font-size: 12px;">
                        © ${new Date().getFullYear()} TIC Portal. All rights reserved.
                    </p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Welcome email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Welcome email failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendCourseEnrollmentEmail(user, course) {
        const mailOptions = {
            from: process.env.EMAILJS_FROM_EMAIL || 'noreply@ticportal.com',
            to: user.email,
            subject: `You've enrolled in ${course.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Course Enrollment Confirmation</h2>
                    <p>Hello ${user.fullName},</p>
                    <p>You have successfully enrolled in the course: <strong>${course.title}</strong>.</p>
                    <p>Start your learning journey now!</p>
                    <a href="${process.env.CLIENT_URL}/course/${course._id}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                              color: white; text-decoration: none; border-radius: 4px; margin: 15px 0;">
                        Start Learning
                    </a>
                    <p>Happy learning!</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #7f8c8d; font-size: 12px;">
                        © ${new Date().getFullYear()} TIC Portal. All rights reserved.
                    </p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Course enrollment email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Course enrollment email failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendNewCourseAvailableEmail(users, course) {
        // This would send to multiple users, so we'd need to handle that
        // For simplicity, this is a basic implementation
        const mailOptions = {
            from: process.env.EMAILJS_FROM_EMAIL || 'noreply@ticportal.com',
            to: 'multiple-recipients', // In practice, you'd use a different approach for bulk emails
            subject: `New Course Available: ${course.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">New Course Available!</h2>
                    <p>We're excited to announce a new course that might interest you:</p>
                    <h3 style="color: #2980b9;">${course.title}</h3>
                    <p>${course.shortDescription}</p>
                    <p><strong>Level:</strong> ${course.level}</p>
                    <p><strong>Category:</strong> ${course.category}</p>
                    <a href="${process.env.CLIENT_URL}/course/${course._id}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                              color: white; text-decoration: none; border-radius: 4px; margin: 15px 0;">
                        View Course
                    </a>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #7f8c8d; font-size: 12px;">
                        © ${new Date().getFullYear()} TIC Portal. All rights reserved.
                    </p>
                </div>
            `
        };

        // In a real implementation, you'd loop through users and send individually
        // or use a bulk email service

        console.log('New course notification would be sent to', users.length, 'users');
        return { success: true, message: 'Notification processed' };
    }

    async sendCustomNotification(user, title, message, metadata = {}) {
        const mailOptions = {
            from: process.env.EMAILJS_FROM_EMAIL || 'noreply@ticportal.com',
            to: user.email,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">${title}</h2>
                    <p>Hello ${user.fullName},</p>
                    <div>${message}</div>
                    ${metadata.actionUrl ? `
                    <a href="${metadata.actionUrl}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #3498db; 
                              color: white; text-decoration: none; border-radius: 4px; margin: 15px 0;">
                        ${metadata.actionText || 'Take Action'}
                    </a>
                    ` : ''}
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #7f8c8d; font-size: 12px;">
                        © ${new Date().getFullYear()} TIC Portal. All rights reserved.
                    </p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Custom notification email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Custom notification email failed:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new EmailService();