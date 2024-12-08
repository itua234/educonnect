const jwt = require('jsonwebtoken');

const socketAuthMiddleware = (TOKEN_SECRET) => (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.error('Authentication error: Token not provided');
            return next(new Error('Authentication error: Token not provided'));
        }
        try {
            const decoded = jwt.verify(token, TOKEN_SECRET);
            socket.user = decoded;
            // Join a room with the user's ID
            socket.join(socket.user._id);
            next();  // Continue with the connection
        }catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                console.error('Authentication error: Token has expired');
                return next(new Error('Authentication error: Token has expired'));
            } else if (jwtError.name === 'JsonWebTokenError') {
                console.error('Authentication error: Invalid token');
                return next(new Error('Authentication error: Invalid token'));
            } else {
                console.error('Authentication error:', jwtError.message);
                return next(new Error('Authentication error: ' + jwtError.message));
            }
        }
    }catch (error) {
        console.error('Server error during authentication:', error);
        return next(new Error('Internal server error during authentication'));
    }
};

module.exports = socketAuthMiddleware;