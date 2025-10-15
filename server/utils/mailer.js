const nodemailer = require('nodemailer');


let transporter = nodemailer.createTransport({
  service: 'gmail',  
  auth: {
    user: process.env.MAIL_USER||'feedlink.info@gmail.com',
    pass: process.env.MAIL_PASS||'zqvx rymj tuxk bfwy'
  },
  tls: {
    rejectUnauthorized: false  
  },
  debug: true  
});

/**
 * Send an email notification to a donee about a donation
 * 
 * @param {Object} donee - The donee object with email and name
 * @param {Object} donor - The donor object with name and contact
 * @returns {Promise} - Promise that resolves with info about the sent email
 */
async function sendDonationNotification(donee, donor, donationId, confirmationToken) {
  if (!donee.email) {
    throw new Error('Donee email is required to send notification');
  }
  
  console.log(`Attempting to send email to: ${donee.email}`);

  const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/donations/${donationId}/confirm?token=${confirmationToken}`;

  const mailOptions = {
    from: '"FeedLink" <feedlink.info@gmail.com>',
    to: donee.email,
    subject: '🍲 New Donation Alert from FeedLink - Action Required',
    text: `
      Dear ${donee.name},

      Great news! ${donor.name} wants to donate food to your organization.
      
      Donor Details:
      Name: ${donor.name}
      Contact: ${donor.contact}
      
      IMPORTANT: Please coordinate with the donor and once the donation is successfully completed, 
      click the link below to confirm the donation:
      
      Confirm Donation: ${confirmationUrl}
      
      This helps us track successful donations and improve our service.
      
      Thank you for being part of the FeedLink community!
      
      Warm regards,
      The FeedLink Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #187bff; text-align: center;">🍲 New Donation Alert!</h2>
        <p>Dear <strong>${donee.name}</strong>,</p>
        <p>Great news! <strong>${donor.name}</strong> wants to donate food to your organization.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Donor Details:</h3>
          <p><strong>Name:</strong> ${donor.name}</p>
          <p><strong>Contact:</strong> ${donor.contact}</p>
        </div>
        
        <p>Please expect their call or coordinate with them directly to arrange the donation.</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚡ Important: Confirm Donation</h3>
          <p style="color: #856404; margin-bottom: 15px;">Once you successfully receive the donation, please confirm it by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${confirmationUrl}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              ✅ Confirm Donation Received
            </a>
          </div>
          <p style="color: #856404; font-size: 12px; margin-top: 10px; margin-bottom: 0;">This helps us track successful donations and improve our service.</p>
        </div>
        
        <p>Thank you for being part of the FeedLink community!</p>
        
        <p style="margin-top: 30px;">Warm regards,<br>The FeedLink Team</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
          <p>© ${new Date().getFullYear()} FeedLink. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    
    if (error.code === 'EAUTH') {
      throw new Error('Authentication failed: check your email credentials');
    } else if (error.code === 'ESOCKET') {
      throw new Error('Network error: check your internet connection');
    } else if (error.code === 'EENVELOPE') {
      throw new Error('Invalid email address format');
    } else {
      throw error;
    }
  }
}

transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});

/**
 * Send verification approval email to a donee organization
 * 
 * @param {Object} donee - The donee object with email, organizationName, and other details
 * @returns {Promise} - Promise that resolves with info about the sent email
 */
async function sendDoneeVerificationEmail(donee) {
  if (!donee.email) {
    throw new Error('Donee email is required to send verification notification');
  }
  
  console.log(`Sending verification email to: ${donee.email}`);

  const mailOptions = {
    from: '"FeedLink Team" <feedlink.info@gmail.com>',
    to: donee.email,
    subject: '🎉 Welcome to FeedLink - Your Organization is Now Listed!',
    text: `
      Dear ${donee.name},

      Congratulations! Your organization "${donee.organizationName}" has been successfully verified and is now listed on FeedLink.

      Organization Details:
      - Name: ${donee.organizationName}
      - Type: ${donee.organizationType}
      - Address: ${donee.address}
      - Contact: ${donee.contact}
      - People Served: ${donee.averagePeopleServed} daily
      - Operating Hours: ${donee.operatingHours?.from} - ${donee.operatingHours?.to}

      What's Next?
      ✅ Your organization is now visible to donors in your area
      ✅ Donors can find and contact you for food donations
      ✅ You'll receive email notifications when someone wants to donate
      ✅ You can build your reputation through donor ratings and feedback

      Important Reminders:
      • Keep your contact information updated
      • Respond promptly to donation offers
      • Maintain food safety and hygiene standards
      • Provide feedback to help donors improve their contributions

      Thank you for joining our mission to eliminate food waste and help those in need!

      If you have any questions or need assistance, please don't hesitate to contact us.

      Welcome to the FeedLink family!

      Best regards,
      The FeedLink Team
      📧 feedlink.info@gmail.com
      🌐 www.feedlink.org
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to FeedLink!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your organization is now successfully listed</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear <strong>${donee.name}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Congratulations! Your organization <strong>"${donee.organizationName}"</strong> has been successfully verified and is now listed on FeedLink.
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📋 Organization Details:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin: 8px 0;"><strong>Name:</strong> ${donee.organizationName}</li>
              <li style="margin: 8px 0;"><strong>Type:</strong> ${donee.organizationType}</li>
              <li style="margin: 8px 0;"><strong>Address:</strong> ${donee.address}</li>
              <li style="margin: 8px 0;"><strong>Contact:</strong> ${donee.contact}</li>
              <li style="margin: 8px 0;"><strong>People Served:</strong> ${donee.averagePeopleServed} daily</li>
              <li style="margin: 8px 0;"><strong>Operating Hours:</strong> ${donee.operatingHours?.from} - ${donee.operatingHours?.to}</li>
            </ul>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1976d2;">🚀 What's Next?</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>✅ Your organization is now visible to donors in your area</li>
              <li>✅ Donors can find and contact you for food donations</li>
              <li>✅ You'll receive email notifications when someone wants to donate</li>
              <li>✅ You can build your reputation through donor ratings and feedback</li>
            </ul>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">📝 Important Reminders:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Keep your contact information updated</li>
              <li>Respond promptly to donation offers</li>
              <li>Maintain food safety and hygiene standards</li>
              <li>Provide feedback to help donors improve their contributions</li>
            </ul>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #333; text-align: center; margin: 30px 0;">
            Thank you for joining our mission to eliminate food waste and help those in need!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #666; margin: 5px 0;">If you have any questions, contact us at:</p>
            <p style="font-size: 14px; color: #667eea; margin: 5px 0;">📧 feedlink.info@gmail.com</p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;"><strong>Welcome to the FeedLink family!</strong></p>
            <p style="margin: 5px 0 0;">Making a difference, one meal at a time 🍽️❤️</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

/**
 * Send rejection/suspension email to a donee organization
 * 
 * @param {Object} donee - The donee object with email, organizationName, and other details
 * @param {string} reason - Optional reason for rejection/suspension
 * @returns {Promise} - Promise that resolves with info about the sent email
 */
async function sendDoneeRejectionEmail(donee, reason = '') {
  if (!donee.email) {
    throw new Error('Donee email is required to send rejection notification');
  }
  
  console.log(`Sending rejection email to: ${donee.email}`);

  const mailOptions = {
    from: '"FeedLink Team" <feedlink.info@gmail.com>',
    to: donee.email,
    subject: '📋 Update on Your FeedLink Registration',
    text: `
      Dear ${donee.name},

      Thank you for your interest in joining FeedLink and your commitment to helping those in need.

      After reviewing your application for "${donee.organizationName}", we regret to inform you that we are unable to approve your registration at this time.

      ${reason ? `Reason: ${reason}` : ''}

      This decision may be due to:
      • Incomplete documentation
      • Verification requirements not met
      • Administrative issues that need to be resolved

      What You Can Do:
      ✓ Review your submission for any missing information
      ✓ Ensure all required documents are properly uploaded
      ✓ Contact us for specific feedback on your application
      ✓ You're welcome to resubmit your application after addressing any issues

      We appreciate your dedication to fighting food waste and helping your community. Please don't hesitate to reach out if you need assistance or have questions about the registration process.

      Best regards,
      The FeedLink Team
      📧 feedlink.info@gmail.com
      🌐 www.feedlink.org
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📋 Registration Update</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Regarding your FeedLink application</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear <strong>${donee.name}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for your interest in joining FeedLink and your commitment to helping those in need.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            After reviewing your application for <strong>"${donee.organizationName}"</strong>, we regret to inform you that we are unable to approve your registration at this time.
          </p>

          ${reason ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Reason:</h4>
            <p style="margin-bottom: 0; color: #856404;">${reason}</p>
          </div>
          ` : ''}

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">This decision may be due to:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Incomplete documentation</li>
              <li>Verification requirements not met</li>
              <li>Administrative issues that need to be resolved</li>
            </ul>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1976d2;">🔄 What You Can Do:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>✓ Review your submission for any missing information</li>
              <li>✓ Ensure all required documents are properly uploaded</li>
              <li>✓ Contact us for specific feedback on your application</li>
              <li>✓ You're welcome to resubmit your application after addressing any issues</li>
            </ul>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            We appreciate your dedication to fighting food waste and helping your community. Please don't hesitate to reach out if you need assistance or have questions about the registration process.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #666; margin: 5px 0;">For questions or support, contact us at:</p>
            <p style="font-size: 14px; color: #667eea; margin: 5px 0;">📧 feedlink.info@gmail.com</p>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Thank you for your understanding.</p>
            <p style="margin: 5px 0 0;"><strong>The FeedLink Team</strong></p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
}

module.exports = {
  sendDonationNotification,
  sendDoneeVerificationEmail,
  sendDoneeRejectionEmail
};