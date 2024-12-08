const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const {createAccessToken} = require("@middleware/auth");
const { sequelize, Sequelize, models: { User } } = require('@models');
const { generateOtp, sendMail } = require('@util/helper');

exports.register = async(req, res) => {
    const { email, name, password } = req.body;
    try{
        await sequelize.transaction(async function(transaction) {
            const user = await User.create({
                email, 
                name,
                password,
                email_verified_at: new Date()
            }, {transaction});

            //create token
            const token = createAccessToken(user);
            console.log(Object.assign(user.dataValues, {token: token}));
            return res.status(201).json({
                message: 'Thanks for signing up! Please check your email to complete your registration.',
                results: token,
                error: false
            });
        });
    }catch(error){
        return res.status(500).json({
            message: "Oops! could not create account, please try again later",
            error: true
        });
    }
};

exports.login = async(req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({
        where: {email: email},
    });
    if(!user || !(await bcrypt.compare(password, user.password))){
        return res.status(400).json({
            message: "Oops!, your email or password is invalid",
            error: true
        });
    }else if(!user.email_verified_at){
        return res.status(401).json({
            message: "Email address not verified, please verify your email before you can login",
            error: true
        });
    }else{
        //create token
        const token = createAccessToken(user);
        console.log(Object.assign(user.dataValues, {token: token}));
        res.status(200).json({
            message: 'Login successful',
            results: Object.assign(user.dataValues, {token: token}),
            error: false
        });
    }
};

exports.logout = (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const user = jwt.decode(
        token, 
        process.env.TOKEN_SECRET
    );

    var newToken = jwt.sign(
        {user: user},
        process.env.TOKEN_SECRET,
        {
            expiresIn: '1s',
        }
    );

    return res.status(200).json({
        message: 'You have been logged out',
        results: newToken,
        error: false
    });
}

exports.google_signin = async (req, res) => {
    try {
        const {code} = req.body;
        // Exchange the authorization code for an access token
        const response = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_CLIENT_REDIRECT,
                grant_type: 'authorization_code'
            }
        );
        const accessToken = response.data.access_token;
        if (!accessToken) {
            console.error('No access token received:', response.data);
            return res.status(400).json({
                message: 'Failed to get access token',
                error: true
            });
        }
        // Fetch user details using the access token
        const userResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );
        const userDetails = userResponse.data;
        // Check if user exists
        const user = await User.findOne({
            where: {
                [Sequelize.Op.or]: [
                    { googleId: userDetails.sub },
                    { email: userDetails.email }
                ],
            },
        });
        if (user) {
            if (!user.googleId) {
                user.googleId = userDetails.sub;
                await user.save();
            }
        }else{
            user = await User.create({
                name: userDetails.name,
                email: userDetails.email,
                googleId: userDetails.sub,
                password: crypto.randomBytes(16).toString('hex'),
                email_verified_at: Date.now()
            });
        }
        //create token
        const token = createAccessToken(user);
        res.status(200).json({
            message: 'Login successful',
            results: { ...user.toObject(), token },
            error: false
        });
    }catch (error) {
        console.error('Google sign-in error:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
            message: 'Error during Google sign-in',
            error: true,
            details: error.response?.data || error.message
        });
    }
}