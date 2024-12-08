const Queue = require('bull');
//const { sendMail } = require('../util/helper');
// Log connection details (remove in production)
console.log('Connecting to Redis with:', {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD
});

const createQueue = (queueName) => {
    return new Queue(queueName, {
        redis: {
            port: parseInt(process.env.REDIS_PORT) || 6379,
            host: process.env.REDIS_HOST || 'YOUR_REDIS_HOST',
            password: process.env.REDIS_PASSWORD || 'YOUR_REDIS_PASSWORD',
            tls: process.env.REDIS_TLS === 'true' ? {rejectUnauthorized: false} : undefined,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                console.log(`Retrying Redis connection in ${delay}ms...`);
                return delay;
            }
        },
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: 100,
            removeOnFail: 200
        }
    });
};
// Create separate queues for different tasks
const emailQueue = createQueue('email');
const uploadQueue = createQueue('upload');
const notificationQueue = createQueue('notification');
const dataProcessingQueue = createQueue('dataProcessing');
// Generic queue event handler setup
const setupQueueEvents = (queue) => {
    queue.on('error', (error) => {
        console.error(`${queue.name} queue error:`, error);
    });
    queue.on('waiting', (jobId) => {
        console.log(`${queue.name} job ${jobId} is waiting`);
    });
    queue.on('active', (job) => {
        console.log(`${queue.name} job ${job.id} has started processing`);
    });
    queue.on('completed', (job, result) => {
        console.log(`${queue.name} job ${job.id} completed`);
        console.log('Result:', result);
    });
    queue.on('failed', (job, err) => {
        console.log(`${queue.name} job ${job.id} failed with error ${err.message}`);
    });
    queue.on('stalled', (job) => {
        console.warn(`${queue.name} job ${job.id} has stalled`);
    });
};
// Set up events for all queues
[emailQueue, 
    uploadQueue, 
    notificationQueue, 
    dataProcessingQueue
].forEach(setupQueueEvents);

// Process email jobs
emailQueue.process(async (job) => {
    const { email, subject, template, data } = job.data;
    //await sendMail({ email, subject, template, data });
    return { status: 'sent', messageId: `msg_${Date.now()}`, recipient: email };
});
// Process upload jobs
uploadQueue.process(async (job) => {
    const { file, destination, options } = job.data;
    // Implement your upload logic here
    // Example: await cloudStorage.uploadFile(file, destination, options);
    return { status: 'uploaded', path: destination };
});
// Process notification jobs
notificationQueue.process(async (job) => {
    const { userId, message, type } = job.data;
    // Implement your notification logic here
    // Example: await pushNotification(userId, message, type);
    return { status: 'sent', userId, timestamp: new Date() };
});
// Process data processing jobs
dataProcessingQueue.process(async (job) => {
    const { data, operation } = job.data;
    // Implement your data processing logic here
    // Example: const result = await processData(data, operation);
    return { status: 'processed', result };
});

module.exports = {
    emailQueue,
    uploadQueue,
    notificationQueue,
    dataProcessingQueue
};