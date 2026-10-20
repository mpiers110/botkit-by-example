import mongoose, { Schema } from 'mongoose';
const WhatsAppWebhookSchema = new Schema({
    event: { type: String, index: true },
    rawPayload: { type: Schema.Types.Mixed, required: true },
    parsedPayload: { type: Schema.Types.Mixed },
    signature: { type: String },
    verified: { type: Boolean, default: false },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date },
    error: { type: String },
}, { timestamps: true });
export const WhatsAppWebhookModel = mongoose.model('WhatsAppWebhook', WhatsAppWebhookSchema);
