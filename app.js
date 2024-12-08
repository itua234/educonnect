const express = require('express');
const app = express();
require('dotenv').config();
require('module-alias/register');
require('./app/services/queues'); 
const socketAuth = require('@middleware/socketAuth');
const http = require('http');
const wsManager = require('./app/services/wsManager');
const server = http.createServer(app);
const io = wsManager.init(server);

const db = require('@models');
const api = require('./routes/api');
const jwt = require('jsonwebtoken');

const AppError = require('./app/util/appError');
const globalErrorHandler = require('./app/util/errorHandler');

//app.use(express.json());
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

const cors = require('cors');
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',')
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
// Security middleware
const helmet = require('helmet');
app.use(helmet());
// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    max: 100, // limit each IP to 100 requests per windowMs
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour!'
});

const { PORT, NODE_ENV, TOKEN_SECRET } = process.env; 

// Middleware to authenticate socket connections using JWT
io.use(socketAuth(TOKEN_SECRET));
// Listen for socket connections
io.on('connection', (socket) => {
    console.log(socket.user.user.email+' is connected to socket');  // The user will have their info attached here
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
    socket.on('reconnect_attempt', () => {
        const token = socket.handshake.auth.token;
        if (token) {
            jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    socket.disconnect();
                } else {
                    socket.user = decoded;
                }
            });
        }
    });
});

process.on('uncaughtException', (error) => {
    console.error('FATAL ERROR 💥', error);
});
process.on('unhandledRejection', (error) => {
    console.error('UNHANDLED REJECTION 💥', error);
});
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED.');
});

const syncOptions = NODE_ENV == "development" ? {} : { alter: false };
db.sequelize.authenticate()
.then(() => {
    return db.sequelize.sync(syncOptions);
}).then(() => {
    server.listen(PORT, () => {
        console.log(`[START] Server running on Port: ${PORT}`);
    });
    useRoutes();
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

function useRoutes() {
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    });
    app.use('/api', limiter);
    app.use('/api/v1', api);
    //Handling unhandles routes for all http methods
    app.all("*", (req, res, next) => {
        next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
    });
    app.use(globalErrorHandler);
}

module.exports = app;