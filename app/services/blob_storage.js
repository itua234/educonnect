const { BlobServiceClient } = require('@azure/storage-blob');
const azureStorage = {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME
};

const uploadToBlob = async (file) => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        azureStorage.connectionString
    );
    const containerClient = blobServiceClient.getContainerClient(
        azureStorage.containerName
    );
    // Create unique filename
    const fileName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    // Upload file buffer to blob
    await blockBlobClient.upload(file.buffer, file.buffer.length, {
        blobHTTPHeaders: {
            blobContentType: file.mimetype
        }
    });
    
    return {
        secure_url: blockBlobClient.url
    };
}

module.exports = { uploadToBlob };