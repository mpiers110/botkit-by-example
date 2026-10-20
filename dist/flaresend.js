import { Flaresend } from "flaresend";
import { CONFIG } from "./config.js";
export function sanitizeWhatsAppNumber(p) {
    if (!p)
        return '';
    return p.replace(/[^\d]/g, '');
}
// ============================================================================
// FLARESEND WHATSAPP CLIENT
// ============================================================================
export class WhatsAppClient {
    client = null;
    apiKey;
    constructor(apiKey = CONFIG.FLARESEND_API_KEY) {
        this.apiKey = apiKey;
        if (this.apiKey) {
            try {
                this.client = new Flaresend(this.apiKey);
            }
            catch (err) {
                console.warn("[WhatsAppClient] Flaresend SDK init error:", err.message);
            }
        }
    }
    parseWebhook(body) {
        if (!body)
            return [];
        if (this.client?.webhooks?.parseEvent) {
            try {
                const { event, data } = this.client.webhooks.parseEvent(body);
                return { event, data };
            }
            catch (err) {
                console.error("[WhatsAppClient] Parse event failed:", err.message);
            }
        }
        return null;
    }
    async sendMessage(to, text) {
        if (!this.apiKey) {
            console.warn(`[Flaresend MOCK OUTBOUND] To: ${to} \n${text}\n-------------------`);
            return { success: true, messageId: `mock_appointment_${Date.now()}` };
        }
        try {
            const res = await this.client.messages.send({
                recipients: [to],
                type: "text",
                text: text,
            });
            return { success: res.success, messageId: res.successful_recipients?.[0] };
        }
        catch (err) {
            console.error("[WhatsAppClient] Flaresend send failed:", err.message);
            return { success: false, error: err.message };
        }
    }
}
// Singleton WhatsApp client instance
export const WhatsApp = new WhatsAppClient();
