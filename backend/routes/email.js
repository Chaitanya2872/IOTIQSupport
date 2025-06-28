const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

console.log('Loading email routes...');

// Create transporter with better error handling
let transporter;
try {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    console.log('Email transporter created successfully');
} catch (error) {
    console.error('Error creating email transporter:', error);
}

// Verify transporter configuration
if (transporter) {
    transporter.verify((error, success) => {
        if (error) {
            console.log('Email configuration error:', error);
        } else {
            console.log('Email server is ready to send messages');
        }
    });
}

router.post('/send-email', async (req, res) => {
    console.log('Received email request:', req.body);
    
    try {
        const { contact } = req.body;

        if (!contact) {
            console.log('Missing contact information');
            return res.status(400).json({ error: 'Contact information is required' });
        }

        if (!transporter) {
            console.log('Email transporter not available');
            return res.status(500).json({ error: 'Email service not configured' });
        }

        // Check if required environment variables are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
            console.log('Missing email configuration');
            return res.status(500).json({ error: 'Email service not properly configured' });
        }

        console.log('Preparing to send email...');

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

        // Check if contact is an email address
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
        console.log('Contact is email:', isEmail);
        
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

            console.log('Sending emails to admin and user...');
            // Send both emails
            await Promise.all([
                transporter.sendMail(adminMailOptions),
                transporter.sendMail(userMailOptions)
            ]);
            console.log('Both emails sent successfully');
        } else {
            console.log('Sending email to admin only...');
            // Only send admin email for phone numbers
            await transporter.sendMail(adminMailOptions);
            console.log('Admin email sent successfully');
        }

        res.json({ message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error in send-email route:', error);
        
        // More specific error messages
        if (error.code === 'EAUTH') {
            return res.status(500).json({ error: 'Email authentication failed' });
        } else if (error.code === 'ECONNECTION') {
            return res.status(500).json({ error: 'Email connection failed' });
        } else {
            return res.status(500).json({ error: 'Failed to send email: ' + error.message });
        }
    }
});

console.log('Email routes loaded');
module.exports = router;