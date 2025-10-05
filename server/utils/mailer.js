const nodemailer = require('nodemailer');


let transporter = nodemailer.createTransport({
  service: 'gmail',  
  auth: {
    user: process.env.MAIL_USER||'feedlink.info@gmail.com',
    pass: process.env.MAIL_PASS||'oqqw gmmj parj ppiz'
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
async function sendDonationNotification(donee, donor) {
  if (!donee.email) {
    throw new Error('Donee email is required to send notification');
  }
  
  console.log(`Attempting to send email to: ${donee.email}`);

  const mailOptions = {
    from: '"FeedLink" <feedlink.info@gmail.com>',
    to: donee.email,
    subject: '🍲 New Donation Alert from FeedLink',
    text: `
      Dear ${donee.name},

      Great news! ${donor.name} wants to donate food to your organization.
      
      Donor Details:
      Name: ${donor.name}
      Contact: ${donor.contact}
      
      Please expect their call or coordinate with them directly to arrange the donation.
      
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

module.exports = {
  sendDonationNotification
};