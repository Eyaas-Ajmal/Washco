import { v2 as cloudinary } from 'cloudinary';
import config from './env.js';

// Configure Cloudinary if credentials are available
const useCloudinary = !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);

if (useCloudinary) {
    cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
    });
}

export { cloudinary, useCloudinary };
