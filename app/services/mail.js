const nodemailer = require('nodemailer');
const path = require("path");
const ejs  = require("ejs");
const fs = require('fs');
const juice = require('juice');

const sendMail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        service: process.env.MAIL_MAILER,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        }
    });
    const {email, subject, template, data, attachments} = options;
    //get the template file
    const templatePath = path.join(__dirname, "..", "../views", "emails", template);
    //render the email template
    const html = await ejs.renderFile(templatePath, data);
    // Read and concatenate multiple CSS files
    const cssFiles = [
        path.join(__dirname, "..", "../public/assets/css/email/dashliteee9a.css"),
        path.join(__dirname, "..", "../public/assets/css/email/themeee9a.css"),
        path.join(__dirname, "..", "../public/assets/css/email/style-email.css")
    ];

    let cssContent = '';
    for(const cssFile of cssFiles){
        cssContent += fs.readFileSync(cssFile, 'utf8');
    }
    // Inline the CSS into the HTML
    const inlinedHtml = juice.inlineContent(html, cssContent);

    // Email content
    const mailOptions = {
        from: `${process.env.APP_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject,
        html: inlinedHtml,
        attachments
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

module.exports = sendMail;
