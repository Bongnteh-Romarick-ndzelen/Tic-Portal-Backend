# Nodemailer Setup Guide

This guide will help you set up Nodemailer for email verification in the TIC Portal application.

## Why Nodemailer?

We switched from EmailJS to Nodemailer because:

- Nodemailer is more robust and widely used
- Better error handling and debugging capabilities
- More flexible configuration options
- Active community support and regular updates

## Prerequisites

1. A Gmail account (or other SMTP provider)
2. Access to your SMTP server settings
3. 2-Factor Authentication enabled on your Gmail account (recommended)

## Step 1: Configure Gmail with 2-Factor Authentication and App Password

If you're using Gmail with 2-factor authentication (which is recommended), you'll need to generate an app-specific password:

1. Go to your Google Account settings (<https://myaccount.google.com/>)
2. In the left navigation panel, select "Security"
3. Under "Signing in to Google," select "2-Step Verification" (you may need to set this up first if you haven't already)
4. At the bottom of the page, select "App passwords"
5. You may need to enter your password to continue
6. Under "Select app," choose "Mail"
7. Under "Select device," choose "Other" and type "TIC Portal" or leave it as "Other"
8. Select "Generate"
9. Copy the 16-character code that appears
10. Use this code as your `EMAILJS_PASSWORD` in your .env file

## Step 2: Update Environment Variables

Update your `.env` file with the following variables:

```env
EMAILJS_USER=your_email@example.com
EMAILJS_PASSWORD=your_app_specific_password
EMAILJS_HOST=smtp.gmail.com
EMAILJS_FROM_EMAIL=noreply@ticportal.com
CLIENT_URL=http://localhost:5000
```

### Variable Explanations

- `EMAILJS_USER`: Your email address used for sending emails (this should be the same as your Gmail address if using Gmail)
- `EMAILJS_PASSWORD`: Your app-specific password (not your regular email password) if you have 2-factor authentication enabled
- `EMAILJS_HOST`: Your SMTP server (e.g., smtp.gmail.com for Gmail)
- `EMAILJS_FROM_EMAIL`: The email address that will appear as the sender
- `CLIENT_URL`: The URL of your frontend application

## Step 3: Test the Setup

1. Restart your server
2. Try to sign up a new user
3. Check if you receive a verification email
4. Click the verification link to verify the email
5. Try to log in with the verified account

## Testing with Swagger UI

You can test the email verification feature using the Swagger UI documentation:

1. **Sign Up**:
   - Go to the `/api/auth/signup` endpoint in Swagger
   - Fill in the required user details
   - Submit the request
   - You should receive a response indicating that the user was registered and a verification email was sent

2. **Check Your Email**:
   - Check the inbox of the email address you used for signup
   - You should receive a verification email with a link

3. **Verify Email**:
   - Click the verification link in the email
   - This will call the `/api/auth/verify-email` endpoint with the token
   - You should receive a response indicating that the email was verified successfully

4. **Log In**:
   - Go to the `/api/auth/login` endpoint in Swagger
   - Use the same credentials you used for signup
   - Submit the request
   - You should now be able to log in successfully since your email is verified

## Troubleshooting

### Authentication Error (Missing credentials for "PLAIN")

If you're seeing an error like "Missing credentials for PLAIN", this indicates an authentication issue:

1. **Verify App Password**:
   - Ensure you're using an app-specific password, not your regular Gmail password
   - Generate a new app-specific password and update your .env file

2. **Check 2-Factor Authentication**:
   - Ensure 2-Step Verification is enabled on your Google Account
   - App passwords are only available when 2-Step Verification is enabled

3. **Verify Credentials Format**:
   - Check that there are no extra spaces in your EMAILJS_PASSWORD
   - Ensure your EMAILJS_USER matches exactly with your Gmail address

### SMTP Connection Error (ETIMEDOUT)

If you're seeing connection timeout errors:

1. **Check Network Connectivity**:
   - Ensure your firewall isn't blocking outbound connections on port 587
   - Try testing from a different network

2. **Verify SMTP Settings**:
   - Confirm EMAILJS_HOST is set to smtp.gmail.com
   - Confirm port is set to 587

3. **Test SMTP Connection**:
   - Use a tool like telnet to test the connection:

     ```telnet smtp.gmail.com 587
     ```

## Security Considerations

1. Never commit your `.env` file to version control
2. Use app-specific passwords when available
3. Regularly rotate your email passwords
4. Monitor your email sending limits to avoid being rate-limited

## Customization

You can customize the verification email template by modifying the `sendVerificationEmail` function in `src/controllers/auth/authController.js`.

The current template includes:

- A personalized greeting with the user's full name
- A verification link
- Instructions for users who didn't sign up

You can modify the HTML content to match your branding or add additional information.

## Reverting to EmailJS

If you need to revert to EmailJS:

1. Install emailjs: `npm install emailjs`
2. Remove nodemailer: `npm uninstall nodemailer`
3. Update the authController.js file to use the EmailJS implementation
4. Refer to the EMAILJS_SETUP.md file for configuration details
