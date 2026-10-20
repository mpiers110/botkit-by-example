import express from 'express';
import telegramRouter from '../webhooks/telegram/onboarding.js';
import whatsAppRouter from '../webhooks/whatsapp/onboarding.js';
const router = express.Router();
router.get("/webhooks/whatsapp", whatsAppRouter);
router.use("/webhooks/telegram", telegramRouter);
export default router;
