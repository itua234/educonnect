const jwt = require('jsonwebtoken');
const { models } = require('@models');
const { User } = models;
const { TOKEN_SECRET, APP_TOKEN } = process.env;

module.exports = {
    authGuard: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) return res.status(401).json({ error: true, message: "unauthenticated" });
        console.log(token);
        jwt.verify(token, TOKEN_SECRET, async(err, user) => {
            if (err) return res.status(401).json({ error: true, message: "unauthenticated" });
            const getUser = await User.findOne({
                where: {email: user.user.email}, raw: true
            });
            if(!getUser) throw 'Invalid Access Token Sent';
            req.user = getUser;
            next();
        });
    },

    appGuard: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const appKey = authHeader && authHeader.split(' ')[1];
        if (appKey === APP_TOKEN) {
            next();
        } else {
            return res.status(403).json({ error: true, message: "Forbidden" });
        }
    },

    createAccessToken: (user) => {
        return jwt.sign(
            {user: user},
            process.env.TOKEN_SECRET,
            {
                expiresIn: process.env.TOKEN_EXPIRE,
            }
        );
    }
}