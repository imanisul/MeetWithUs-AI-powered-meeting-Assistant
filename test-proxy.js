import axios from 'axios';
async function test() {
    try {
        const res = await axios.get('http://localhost:8000/documents', {
            headers: {
                Authorization: 'Bearer test-token'
            }
        });
        console.log("Success:", res.status);
    } catch (e) {
        console.error("Error:", e.response?.status, e.response?.data);
    }
}
test();
