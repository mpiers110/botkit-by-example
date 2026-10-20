import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { ShuruBotEngine } from './services/engine.js';
import { WhatsAppClient, sanitizeWhatsAppNumber } from '../flaresend.js';
const app = express();
const PORT = 3000;
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Turn off buffering to immediately fail and reveal the REAL driver error if the URI or credentials are bad
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);
// ---------------------------------------------------------------------------
// Serverless-safe DB connection.
// Vercel reuses warm function instances between invocations but does NOT keep
// a persistent process running like a traditional server. We cache the
// connection (and the email config load) on the module scope so a warm
// invocation reuses them, and only reconnect when actually needed.
// ---------------------------------------------------------------------------
let dbConnectionPromise = null;
async function connectDB() {
    // Already connected on this warm instance
    if (mongoose.connection.readyState === 1) {
        return;
    }
    // A connection attempt is already in flight — reuse it instead of racing
    if (!dbConnectionPromise) {
        dbConnectionPromise = mongoose
            .connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        })
            .then((conn) => {
            console.log('✅ Connected to DB');
            return conn;
        })
            .catch((err) => {
            // Reset so the next request can retry instead of being stuck on a dead promise
            dbConnectionPromise = null;
            throw err;
        });
    }
    await dbConnectionPromise;
}
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
        bot: "shuruBot",
        uptime: process.uptime(),
        mongodb: mongoose?.connection?.readyState === 1 ? "connected" : "in-memory-fallback",
    });
});
// GET /webhook: Verification endpoint for WhatsApp / Flaresend webhooks
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe") {
        console.log("[Webhook] Verification succeeded!");
        return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "Verification token mismatch or invalid mode" });
});
// POST /webhook: Inbound WhatsApp message receiver
app.post("/webhook", async (req, res) => {
    try {
        // Acknowledge receipt to WhatsApp quickly (200 OK)
        res.status(200).json({ status: "received" });
        const WhatsApp = new WhatsAppClient();
        const { event, data } = WhatsApp.parseWebhook(req.body);
        if (event === 'message_received') {
            const userMessage = data?.message?.conversation;
            const senderNumber = sanitizeWhatsAppNumber(String(data?.from || ''));
            console.log(`Received WhatsApp message from ${senderNumber}`);
            if (!senderNumber || typeof userMessage !== 'string' || !userMessage.trim()) {
                console.warn('WhatsApp message is missing sender or body');
                return;
            }
            // Execute FSM step
            const result = await ShuruBotEngine.processMessage(senderNumber, userMessage);
            // Send reply to WhatsApp via Flaresend
            if (result) {
                console.log(`[Outbound WhatsApp] To: ${senderNumber} | Text: "${result.outboundText}" | Next State: ${result.nextState}`);
                const sendResult = await WhatsApp.sendMessage(senderNumber, result.outboundText);
                if (!sendResult.success)
                    throw new Error(sendResult.error || 'Failed to send WhatsApp reply');
            }
        }
    }
    catch (err) {
        console.error("[Webhook Error]:", err.message);
        // Ensure we don't crash express
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});
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
        console.log(`🍕 Shuru API running at http://127.0.0.1:${PORT}`);
    });
}
export default app;
