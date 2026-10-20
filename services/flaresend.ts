import { Flaresend } from "flaresend";
import { CONFIG } from "../bot.js";

// ============================================================================
// FLARESEND WHATSAPP CLIENT
// ============================================================================
export interface FlaresendSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const client = new Flaresend(CONFIG.FLARESEND_API_KEY);
  /**
   * Parses a WhatsApp webhook payload from Flaresend and returns an array of parsed messages.
   */
export const parseWhatsAppWebhook = (body: any): any => {
    if (!body) return [];

    if (!CONFIG.FLARESEND_API_KEY) {
      console.error("[Flaresend Webhook Parse Failed]: Missing FLARESEND_API_KEY");
      return [];
    }
    try {
      const parsed = client.webhooks.parseEvent(body);
      const { event, data } = parsed || {};
      return { event, data };
    } catch (err: any) {
      console.error("[Flaresend Webhook Parse Failed]:", err.message);
      return [];
    }
  }
  /**
   * Sends a WhatsApp message via Flaresend.
   */
  export const sendWhatsAppMessage = async (to: string, text: string): Promise<FlaresendSendResponse> => {
    if (!CONFIG.FLARESEND_API_KEY) {
      return { success: false, error: "Missing FLARESEND_API_KEY" };
    }
    try {

        const res = await client.messages.send({
          recipients: [to],
          type: "text",
          text: text,
        });

        return {
          success: res.success,
          messageId: res.successful_recipients?.[0],
        };
    } catch (err: any) {
      console.error(`[Flaresend Send Failed] to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }