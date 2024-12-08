const { sendMail } = require('../util/helper');
const cloudStorage = require('../util/cloudStorage');

const handleEmailJob = async (job) => {
    const { email, subject, template, data } = job.data;
    await sendMail({ email, subject, template, data });
    return { status: 'sent', recipient: email };
};

const handleUploadJob = async (job) => {
    const { file, bucket, destination } = job.data;
    const result = await cloudStorage.uploadFile(bucket, file, destination);
    return { status: 'uploaded', ...result };
};

module.exports = {
    handleEmailJob,
    handleUploadJob
};