import express from 'express';
import telegramRouter from '../../webhooks/onboarding/telegram.js';
import whatsAppRouter from '../../webhooks/onboarding/whatsapp.js';

  const router = express.Router();

  router.get("/webhooks/whatsapp", whatsAppRouter);
 

  router.use("/webhooks/telegram", telegramRouter);
 

export default router;