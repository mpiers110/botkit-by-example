import express from 'express';
import { createServer } from 'node:http';
import { connectDB } from '../../persistence/database.js';
import telegramRouter from '../../webhooks/appointment/telegram.js';
import whatsAppRouter from '../../webhooks/appointment/whatsapp.js';
const app = express();
const PORT = 3000;
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Ensure the DB is connected before any route handler runs.
// Routes are mounted unconditionally below; this middleware gates their execution instead.
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    }
    catch (err) {
        console.error('❌ Database connection failed:', err);
        res.status(503).json({ message: 'Service temporarily unavailable, please try again shortly.' });
    }
});
// Routes are mounted immediately
// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        bot: "appointmentBooking",
        uptime: process.uptime()
    });
});
app.get("/webhooks/whatsapp", whatsAppRouter);
app.use("/webhooks/telegram", telegramRouter);
// Fallbacks
app.use((req, res) => {
    res.status(404).json({
        message: 'Invalid request, please check the url and try again. If the problem persists, please contact the admin.'
    });
});
app.use((error, req, res, next) => {
    console.error('Express error handler caught an error:', error);
    res.status(error.code || 500).json({ message: 'An unknown error has occured' });
});
// Only bind to a port for local dev / traditional hosting.
// On Vercel, the platform invokes the exported `app` directly per-request.
if (!process.env.VERCEL) {
    const server = createServer(app);
    server.listen(PORT, () => {
        console.log(`🍕 BotKit API running at http://127.0.0.1:${PORT}`);
    });
}
export default app;
