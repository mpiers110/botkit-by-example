/**
 * This module connects Telegram webhook requests to the AppointmentBookingEngine FSM.
 * It includes endpoints for health checks, webhook reception, and webhook setup.\
 */
import express, {Request, Response} from "express";
import { Telegram } from "../../telegram.js";
import { AppointmentBookingEngine } from "../services/engine.js";


  const router = express.Router();


  // POST /webhook - Telegram webhook receiver
  router.post("/", async (req: Request, res: Response) => {

    // 2. Immediately ACK with 200 OK to prevent Telegram from retrying
    res.status(200).json({ ok: true });

    try {
      // 3. Parse incoming Telegram payload
      const parsed = Telegram.parseWebhook(req.body);
      if (!parsed || !parsed.text) {
        return; // Ignore non-text updates or unhandled types
      }

      const { chatId, text, from, isCallbackQuery, callbackQueryId } = parsed;

      // Acknowledge inline button press if applicable
      if (isCallbackQuery && callbackQueryId) {
        await Telegram.answerCallbackQuery(callbackQueryId);
      }
      // 4. Send typing indicator
      await Telegram.sendChatAction(chatId, "typing");

      // 5. Adapt /start command to welcome trigger for AppointmentBookingEngine
      const normalizedInput = text === "/start" ? "start" : text;

      // 6. Connect to MedCare AppointmentBooking conversational FSM engine
      // Map telegram user ID with 'tg_' prefix to avoid collision with WhatsApp users
      const conversationUserId = `tg_${chatId}`;
      const outcome = await AppointmentBookingEngine.runTurn(conversationUserId, normalizedInput);

      console.log(
        `[Telegram FSM Turn] NextNode: "${outcome.nextState.currentNodeId}" | Status: "${outcome.nextState.status}"`
      );

      // 7. Dispatch outbound message to Telegram chat ID or channel username
      if (outcome.outboundText) {
        // Clean markdown formatting if needed or pass with Markdown parse_mode
        await Telegram.sendMessage(chatId, outcome.outboundText, {
          parse_mode: "Markdown",
        });
      }
    } catch (err) {
      console.error("[Telegram Webhook Processing Error]:", err);
    }
  });

  // POST /set-webhook - Helper endpoint to set up webhook directly from API
  router.post("/set-webhook", async (req: Request, res: Response) => {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: "Missing required 'url' parameter in body" });
    }

    const result = await Telegram.setWebhook(url);
    res.status(result.ok ? 200 : 500).json(result);
  });

  export default router;