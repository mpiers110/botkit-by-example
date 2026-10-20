import { CONFIG } from "../config.js";
// ============================================================================
// TELEGRAM BOT CLIENT CLASS
// ============================================================================
/**
 * TelegramBotClient manages communication with the Telegram Bot API.
 * Instantiates once and caches bot token, API base URL, and options.
 */
export class TelegramBotClient {
    token;
    apiBaseUrl;
    secretToken;
    /**
     * @param token - Telegram bot API token from @BotFather
     * @param options - Client configuration options
     */
    constructor(token = CONFIG.BOT_TOKEN, options = {}) {
        this.token = token;
        this.apiBaseUrl = options.apiBaseUrl || CONFIG.API_BASE_URL;
        this.secretToken = options.secretToken || CONFIG.WEBHOOK_SECRET;
        if (!this.token) {
            console.warn("[TelegramBotClient] Warning: TELEGRAM_BOT_TOKEN is not provided. Operating in mock mode.");
        }
    }
    /**
     * Constructs the full endpoint URL for a Telegram Bot API method.
     * @param method - Method name (e.g., 'sendMessage', 'setWebhook')
     */
    _buildUrl(method) {
        return `${this.apiBaseUrl}/bot${this.token}/${method}`;
    }
    /**
     * Internal HTTP POST helper to invoke Telegram Bot API methods.
     * @param method - Telegram API method name
     * @param payload - Request body
     */
    async _request(method, payload = {}) {
        if (!this.token) {
            console.log(`[Telegram MOCK] Method: ${method} | Payload:`, JSON.stringify(payload));
            return { ok: true, result: { message_id: Math.floor(Math.random() * 100000) } };
        }
        try {
            const response = await fetch(this._buildUrl(method), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok || !data.ok) {
                console.error(`[Telegram API Error] ${method}:`, data.description || response.statusText);
            }
            return data;
        }
        catch (err) {
            console.error(`[Telegram Request Exception] ${method}:`, err.message);
            return { ok: false, description: err.message };
        }
    }
    /**
     * Parses an incoming Telegram webhook update body.
     * Normalizes updates from private messages, channel posts, or inline callback queries.
     *
     * @param body - Raw JSON payload received on the webhook route
     */
    parseWebhook(body) {
        if (!body || typeof body !== "object") {
            return null;
        }
        // 1. Standard incoming message
        if (body.message) {
            const msg = body.message;
            const text = msg.text || msg.caption || "";
            const chatId = msg.chat?.id;
            if (!chatId)
                return null;
            return {
                chatId,
                text: text.trim(),
                from: {
                    id: msg.from?.id,
                    firstName: msg.from?.first_name || "",
                    lastName: msg.from?.last_name || "",
                    username: msg.from?.username || "",
                },
                messageId: msg.message_id,
                chatType: msg.chat?.type || "private",
                isCallbackQuery: false,
                raw: msg,
            };
        }
        // 2. Channel post (sent to a public or private channel)
        if (body.channel_post) {
            const post = body.channel_post;
            const text = post.text || post.caption || "";
            // Can be numeric channel ID (e.g., -100123456789) or username (@clinic_channel)
            const chatId = post.chat?.username ? `@${post.chat.username}` : post.chat?.id;
            if (!chatId)
                return null;
            return {
                chatId,
                text: text.trim(),
                from: {
                    id: post.chat?.id,
                    firstName: post.chat?.title || "Channel",
                    username: post.chat?.username || "",
                },
                messageId: post.message_id,
                chatType: "channel",
                isCallbackQuery: false,
                raw: post,
            };
        }
        // 3. Callback query (inline keyboard button pressed)
        if (body.callback_query) {
            const cq = body.callback_query;
            const text = cq.data || "";
            const chatId = cq.message?.chat?.id || cq.from?.id;
            if (!chatId)
                return null;
            return {
                chatId,
                text: text.trim(),
                from: {
                    id: cq.from?.id,
                    firstName: cq.from?.first_name || "",
                    lastName: cq.from?.last_name || "",
                    username: cq.from?.username || "",
                },
                messageId: cq.message?.message_id || 0,
                chatType: cq.message?.chat?.type || "private",
                isCallbackQuery: true,
                callbackQueryId: cq.id,
                raw: cq,
            };
        }
        // Unhandled update type (e.g., poll_answer, my_chat_member, edited_message)
        return null;
    }
    /**
     * Sends a text message to a Telegram chat ID or channel username.
     *
     * @param chatId - Target chat ID (e.g. 987654321) or channel username (e.g. "@my_channel")
     * @param text - Message text to send (supports Markdown / HTML)
     * @param options - Additional options like parse_mode and reply_markup
     */
    async sendMessage(chatId, text, options = {}) {
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: options.parse_mode !== undefined ? options.parse_mode : "Markdown",
            disable_web_page_preview: options.disable_web_page_preview ?? true,
            ...options,
        };
        return await this._request("sendMessage", payload);
    }
    /**
     * Sends a typing chat action (e.g. 'typing', 'upload_photo').
     *
     * @param chatId - Target chat ID or channel username
     * @param action - Action string
     */
    async sendChatAction(chatId, action = "typing") {
        return await this._request("sendChatAction", {
            chat_id: chatId,
            action: action,
        });
    }
    /**
     * Answers an incoming callback query to acknowledge button taps in Telegram.
     *
     * @param callbackQueryId - ID of callback query
     * @param text - Notification text
     * @param showAlert - Whether to show alert modal
     */
    async answerCallbackQuery(callbackQueryId, text = "", showAlert = false) {
        if (!callbackQueryId)
            return;
        return await this._request("answerCallbackQuery", {
            callback_query_id: callbackQueryId,
            text: text,
            show_alert: showAlert,
        });
    }
    /**
     * Registers a public webhook URL with Telegram.
     *
     * @param webhookUrl - Publicly accessible HTTPS URL
     * @param options - Webhook registration options
     */
    async setWebhook(webhookUrl, options = {}) {
        const payload = {
            url: webhookUrl,
            secret_token: options.secret_token || this.secretToken,
            max_connections: options.max_connections || 40,
            allowed_updates: options.allowed_updates || ["message", "channel_post", "callback_query"],
        };
        return await this._request("setWebhook", payload);
    }
    /**
     * Removes webhook integration so the bot can fall back to polling if needed.
     */
    async deleteWebhook() {
        return await this._request("deleteWebhook", { drop_pending_updates: true });
    }
    /**
     * Validates bot credentials by fetching bot profile details.
     */
    async getMe() {
        return await this._request("getMe");
    }
}
// Singleton Telegram client instance
export const Telegram = new TelegramBotClient();
