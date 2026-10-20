import { Router } from 'express';
import telegramRouter from '../../webhooks/appointment/telegram.js';
import whatsAppRouter from '../../webhooks/appointment/whatsapp.js';
const router = Router();
router.get("/webhooks/whatsapp", whatsAppRouter);
router.use("/webhooks/telegram", telegramRouter);
export default router;
