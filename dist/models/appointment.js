import mongoose from "mongoose";
const AppointmentStateSchema = new mongoose.Schema({
    waUserId: { type: String, required: true, unique: true, index: true },
    flowId: { type: String, required: true, default: "appointmentBooking" },
    flowVersion: { type: Number, required: true, default: 1 },
    currentNodeId: { type: String, required: true, default: "welcome" },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    retryCount: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        required: true,
        enum: ["active", "completed", "cancelled", "handoff"],
        default: "active",
    },
    lastInboundText: { type: String },
    lastTransitionAt: { type: Date, default: Date.now },
}, { timestamps: true });
const BookingRecordSchema = new mongoose.Schema({
    bookingId: { type: String, required: true, unique: true, index: true },
    waUserId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    service: { type: String, required: true },
    doctor: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, default: "confirmed", enum: ["confirmed", "cancelled", "completed"] },
}, { timestamps: true });
export const AppointmentStateModel = mongoose.model("AppointmentConversationState", AppointmentStateSchema);
export const BookingRecordModel = mongoose.model("AppointmentBookingRecord", BookingRecordSchema);
