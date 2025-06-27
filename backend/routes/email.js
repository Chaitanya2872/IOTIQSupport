const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Create transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

router.post('/send-email', async (req, res) => {
    try {
        const { contact } = req.body;

        if (!contact) {
            return res.status(400).json({ error: 'Contact information is required' });
        }

        // Email to admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: 'Account Deletion Request - IOTIQ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #11271d;">Account Deletion Request</h2>
                    <p>A user has requested account deletion.</p>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <strong>Contact Information:</strong> ${contact}
                    </div>
                    <p>Please process this request according to company policy.</p>
                    <hr style="margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This email was sent from the IOTIQ account deletion system.
                    </p>
                </div>
            `
        };

        // Confirmation email to user (if it's an email address)
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
        
        if (isEmail) {
            const userMailOptions = {
                from: process.env.EMAIL_USER,
                to: contact,
                subject: 'Account Deletion Request Received - IOTIQ',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #11271d;">Account Deletion Request Received</h2>
                        <p>We have received your request to delete your IOTIQ account.</p>
                        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                            <strong>Important:</strong> This action cannot be undone. All your data will be permanently deleted.
                        </div>
                        <p>Our support team will contact you within 24-48 hours to confirm and process your request.</p>
                        <p>If you did not make this request, please contact us immediately.</p>
                        <hr style="margin: 30px 0;">
                        <p style="color: #6b7280; font-size: 12px;">
                            IOTIQ Support Team<br>
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                `
            };

            // Send both emails
            await Promise.all([
                transporter.sendMail(adminMailOptions),
                transporter.sendMail(userMailOptions)
            ]);
        } else {
            // Only send admin email for phone numbers
            await transporter.sendMail(adminMailOptions);
        }

        res.json({ message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

module.exports = router;