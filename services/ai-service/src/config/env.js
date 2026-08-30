import dotenv from 'dotenv';

dotenv.config();

export const env = {
    PORT: process.env.PORT || 8005,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/meetwithus-ai',
    CHROMA_URL: process.env.CHROMA_URL || 'http://localhost:8006',
    JWT_SECRET: process.env.JWT_SECRET,
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost',
};


