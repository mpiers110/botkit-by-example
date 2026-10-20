import {Router} from 'express';
import telegramRouter from '../webhooks/telegram/appointment.js';
import whatsAppRouter from '../webhooks/whatsapp/appointment.js';

  const router = Router();

  router.get("/webhooks/whatsapp", whatsAppRouter);
 

  router.use("/webhooks/telegram", telegramRouter);


export default router;