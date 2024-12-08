const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const juice = require('juice');
const algorithm = 'aes-256-cbc'  //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const path = require("path");
const ejs  = require("ejs");
const axios = require("axios");

module.exports = {
    generateReference: (id) => 
    {
        let token = "";
        let codeAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        codeAlphabet += 'abcdefghijklmnopqrstuvwxyz';
        codeAlphabet += '0123456789';
        let max = codeAlphabet.length - 1;
        for(var i = 0; i < 14; i++){
            token += codeAlphabet[Math.floor(Math.random() * (max - 0) + 0)]; 
        }; 
        return id+token.toLowerCase();
    },
    //Encrypting text
    encrypt: (text) =>
    {
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        // return {iv: iv.toString('hex'), encryptedData: encrypted.toString('hex')};
        return iv.toString('hex') + ":" + encrypted.toString('hex');
    },
    //Decrypting text
    decrypt: (text) =>
    {
        const textParts = text.split(":");
        let iv = Buffer.from(textParts[0], 'hex');
        let encryptedText = Buffer.from(textParts[1], 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    },
    generateOtp: () => 
    {
        // Generates Random number between given pair
        return Math.floor(Math.random() * (9999 - 1000) + 1000);
    },
    modifyTime: (dateStr) => {
        const date = new Date(dateStr);
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ]
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        return `${monthName}, ${year}`;
    },
    returnValidationError: (errors, res, message) => {

        Object.keys(errors).forEach((key, index) => {
            errors[key] = errors[key]["message"];
        });

        return res.status(422).json({
            message: message,
            error: errors
        });
    },
    sendMail: async(options) => {
        // Create a transporter using SMTP
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
            from: `"Oyeahescrow" <${process.env.MAIL_FROM_ADDRESS}>`,
            //from: process.env.MAIL_FROM_ADDRESS,
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
        
    },
    deleteFile: (filePath) => {
        try {
            if(fs.existsSync(filePath)){
                //Delete the file
                fs.unlinkSync(filePath);
            }
            console.log("File deleted:", filePath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log("File does not exist:", filePath);
            } else {
                console.error("Error deleting file:", filePath, error);
            }
        }
    }

}