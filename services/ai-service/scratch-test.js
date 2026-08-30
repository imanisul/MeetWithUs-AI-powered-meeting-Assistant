import { connectDB } from './src/config/db.js';
import { queryVectorStore } from './src/services/document.service.js';
import { env } from './src/config/env.js';

async function test() {
    try {
        await connectDB();
        console.log("DB connected");
        const user = { role: 'SUPER_ADMIN', id: 'test', email: 'test@test.com' };
        const result = await queryVectorStore('test', user);
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e.message);
        console.error(e);
    }
    process.exit(0);
}
test();
