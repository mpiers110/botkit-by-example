import { Flaresend } from "flaresend";
import { CONFIG } from "../bot.js";
export const WhatsApp = {
    /**
     * Parses a WhatsApp webhook payload from Flaresend and returns an array of parsed messages.
     */
    parseWebhook(body) {
        if (!body)
            return [];
        if (!CONFIG.FLARESEND_API_KEY) {
            console.error("[Flaresend Webhook Parse Failed]: Missing FLARESEND_API_KEY");
            return [];
        }
        try {
            const client = new Flaresend(CONFIG.FLARESEND_API_KEY);
            const parsed = client.webhooks.parseEvent(body);
            const { event, data } = parsed || {};
            return { event, data };
        }
        catch (err) {
            console.error("[Flaresend Webhook Parse Failed]:", err.message);
            return [];
        }
    },
    /**
     * Sends a WhatsApp message via Flaresend.
     */
    async sendMessage(to, text) {
        if (!CONFIG.FLARESEND_API_KEY) {
            console.warn(`[Flaresend MOCK] To: ${to} | Message: ${text}`);
            return { success: true, messageId: `mock_${Date.now()}` };
        }
        // Try Flaresend SDK if available
        try {
            const client = new Flaresend(CONFIG.FLARESEND_API_KEY);
            const res = await client.messages.send({
                recipients: [to],
                type: "text",
                text: text,
            });
            return {
                success: res.success,
                messageId: res.successful_recipients?.[0],
            };
        }
        catch (err) {
            console.error(`[Flaresend Send Failed] to ${to}:`, err.message);
            return { success: false, error: err.message };
        }
    },
};
