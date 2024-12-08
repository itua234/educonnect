const socketIo = require('socket.io');
let io;
const allowedOrigins = process.env.NODE_ENV == 'production'  
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : "*";

module.exports = {
    init: (server) => {
        io = socketIo(server, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                allowedHeaders: [
                    'Authorization',
                    'Content-Type',
                    'Accept',
                    'X-Requested-With'
                ],
                credentials: true
            }
        });
        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};