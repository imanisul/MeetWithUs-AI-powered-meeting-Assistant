import {ChromaClient} from 'chromadb';
import { env } from './env.js';

// Parse CHROMA_URL into host and port for chromadb v3.5+ client
const chromaUrl = new URL(env.CHROMA_URL);

export const chroma = new ChromaClient({
    host: chromaUrl.hostname,
    port: parseInt(chromaUrl.port, 10) || 8000,
    ssl: chromaUrl.protocol === 'https:',
});



