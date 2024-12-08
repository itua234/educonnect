const crypto = require('crypto');
const fs = require('fs');

// Function to generate random secret
const generateSecret = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Function to generate a constant token using a predictable but secure method
const generateConstantToken = (prefix = 'app') => {
    // Create a constant base using a combination of static strings
    const baseString = `${prefix}_${process.env.NODE_ENV || 'development'}_token`;
    return crypto.createHash('sha256').update(baseString).digest('hex');
};

const secrets = {
    // For guest/public API access - constant token
    APP_TOKEN: generateConstantToken('app'),
    
    // For JWT signing - random secret
    TOKEN_SECRET: generateSecret(64)  // Using 64 bytes for JWT secret (recommended)
};

// Optional: Add a timestamp for reference
const timestamp = new Date().toISOString();
const secretsWithComment = `# Generated on ${timestamp}\n` + 
    Object.entries(secrets)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

// Save to a local file that's gitignored
fs.writeFileSync('.env.secret', secretsWithComment);

// Optional: Log the tokens (only during setup)
console.log('Generated secrets:');
console.log('APP_TOKEN (for guest access):', secrets.APP_TOKEN);
console.log('TOKEN_SECRET (for JWT):', secrets.TOKEN_SECRET);