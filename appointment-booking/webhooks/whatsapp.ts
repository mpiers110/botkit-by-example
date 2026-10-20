/**
 * This module connects WhatsApp webhook requests to the AppointmentBookingEngine FSM.
 */
import express, {Request, Response} from "express";
import { sanitizeWhatsAppNumber, WhatsApp } from "../../flaresend.js";
import { AppointmentBookingEngine } from "../services/engine.js";


  const router = express.Router();


  // GET /: Verification endpoint for WhatsApp / Flaresend webhooks
  router.get("/", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe") {
      console.log("[Webhook] Verification succeeded!");
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: "Verification token mismatch or invalid mode" });
  });

  // POST /: Inbound WhatsApp message receiver
  router.post("/", async (req: Request, res: Response) => {
    try {
      // Acknowledge receipt to WhatsApp quickly (200 OK)
      res.status(200).json({ status: "received" });
      const { event, data } = WhatsApp.parseWebhook(req.body);

      if (event === 'message_received') {
        const userMessage = data?.message?.conversation;
        const senderNumber = sanitizeWhatsAppNumber(String(data?.from || ''));
        console.log(`Received WhatsApp message from ${senderNumber}`);
        if (!senderNumber || typeof userMessage !== 'string' || !userMessage.trim()) {
          console.warn('WhatsApp message is missing sender or body');
          return;
        }
        // Execute conversational FSM turn
        const outcome = await AppointmentBookingEngine.runTurn(senderNumber, userMessage);

        console.log(
          `[State Transition] NextNode: "${outcome.nextState.currentNodeId}" | Status: "${outcome.nextState.status}" | Retries: ${outcome.nextState.retryCount}`
        );

        // Dispatch outbound WhatsApp response
        if (outcome.outboundText) {
          await WhatsApp.sendMessage(senderNumber, outcome.outboundText);
        }

      }

    } catch (err: any) {
      console.error("[Webhook Error]:", err.message);
      // Ensure we don't crash express
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  });

  export default router;