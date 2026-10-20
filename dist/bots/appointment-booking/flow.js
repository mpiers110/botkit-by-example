// ============================================================================
// CONVERSATIONAL FLOW SPECIFICATION: appointmentBooking
// ============================================================================
export const APPOINTMENT_FLOW = {
    welcome: {
        id: "welcome",
        renderText: () => "🏥 *Welcome to MedCare Health Clinic!*\n" +
            "I am your automated WhatsApp scheduling assistant.\n\n" +
            "How may we assist you today?\n" +
            "1️⃣ *Book New Appointment*\n" +
            "2️⃣ *Check My Booking*\n" +
            "3️⃣ *Cancel Appointment*\n" +
            "4️⃣ *Speak to Receptionist*\n\n" +
            "_(Reply with 1, 2, 3, or 4)_",
        transitions: [
            { patterns: ["1", "book", "new", "appointment", "schedule"], targetNodeId: "choose_service" },
            { patterns: ["2", "check", "view", "status", "my booking"], targetNodeId: "lookup_booking" },
            { patterns: ["3", "cancel", "reschedule"], targetNodeId: "cancel_flow" },
            { patterns: ["4", "receptionist", "agent", "human", "talk"], targetNodeId: "receptionist_handoff" },
        ],
        fallbackText: "⚠️ Please reply with *1* to book, *2* to check status, *3* to cancel, or *4* for receptionist.",
        maxRetries: 3,
    },
    choose_service: {
        id: "choose_service",
        renderText: () => "🩺 *Step 1 of 5: Select a Medical Service*\n\n" +
            "1️⃣ *General Consultation* — Dr. Sarah Chen ($60)\n" +
            "2️⃣ *Dental Care & Hygiene* — Dr. Michael Patel ($90)\n" +
            "3️⃣ *Cardiology Screening* — Dr. James Wilson ($130)\n" +
            "4️⃣ *Pediatrics / Child Care* — Dr. Emily Taylor ($75)\n\n" +
            "_(Reply with 1, 2, 3, or 4, or 'menu' to go back)_",
        transitions: [
            {
                patterns: ["1", "general", "consultation", "chen"],
                targetNodeId: "choose_date",
                onMatch: (_in, ctx) => {
                    ctx.service = "General Consultation";
                    ctx.doctor = "Dr. Sarah Chen";
                },
            },
            {
                patterns: ["2", "dental", "patel", "teeth"],
                targetNodeId: "choose_date",
                onMatch: (_in, ctx) => {
                    ctx.service = "Dental Care & Hygiene";
                    ctx.doctor = "Dr. Michael Patel";
                },
            },
            {
                patterns: ["3", "cardiology", "wilson", "heart"],
                targetNodeId: "choose_date",
                onMatch: (_in, ctx) => {
                    ctx.service = "Cardiology Screening";
                    ctx.doctor = "Dr. James Wilson";
                },
            },
            {
                patterns: ["4", "pediatrics", "taylor", "child"],
                targetNodeId: "choose_date",
                onMatch: (_in, ctx) => {
                    ctx.service = "Pediatrics / Child Care";
                    ctx.doctor = "Dr. Emily Taylor";
                },
            },
        ],
        fallbackText: "Please choose a service from 1 to 4 (e.g., reply '1' for General Consultation).",
        maxRetries: 2,
    },
    choose_date: {
        id: "choose_date",
        renderText: (ctx) => `📅 *Step 2 of 5: Select Date for ${ctx.service}*\n\n` +
            "Please choose an available clinic day:\n" +
            "1️⃣ *Tomorrow (Wednesday)*\n" +
            "2️⃣ *Thursday*\n" +
            "3️⃣ *Friday*\n" +
            "4️⃣ *Next Monday*\n\n" +
            "_(Or type a custom date like 'Oct 24')_",
        transitions: [
            {
                patterns: ["1", "tomorrow", "wednesday"],
                targetNodeId: "choose_time",
                onMatch: (_in, ctx) => { ctx.date = "Tomorrow (Wednesday)"; },
            },
            {
                patterns: ["2", "thursday"],
                targetNodeId: "choose_time",
                onMatch: (_in, ctx) => { ctx.date = "Thursday"; },
            },
            {
                patterns: ["3", "friday"],
                targetNodeId: "choose_time",
                onMatch: (_in, ctx) => { ctx.date = "Friday"; },
            },
            {
                patterns: ["4", "monday", "next monday"],
                targetNodeId: "choose_time",
                onMatch: (_in, ctx) => { ctx.date = "Next Monday"; },
            },
            {
                patterns: ["*"], // Accept custom date
                targetNodeId: "choose_time",
                onMatch: (input, ctx) => { ctx.date = input.trim(); },
            },
        ],
        fallbackText: "Please pick a date (1: Tomorrow, 2: Thursday, 3: Friday, 4: Monday).",
        maxRetries: 2,
    },
    choose_time: {
        id: "choose_time",
        renderText: (ctx) => `⏰ *Step 3 of 5: Select Time Slot*\n` +
            `Date: *${ctx.date}* | Doctor: *${ctx.doctor}*\n\n` +
            "Available openings:\n" +
            "1️⃣ *Morning Slot* — 09:30 AM\n" +
            "2️⃣ *Afternoon Slot* — 02:00 PM\n" +
            "3️⃣ *Evening Slot* — 05:15 PM\n\n" +
            "_(Reply 1, 2, or 3)_",
        transitions: [
            {
                patterns: ["1", "morning", "9", "9:30"],
                targetNodeId: "ask_patient_name",
                onMatch: (_in, ctx) => { ctx.timeSlot = "09:30 AM"; },
            },
            {
                patterns: ["2", "afternoon", "2", "2:00"],
                targetNodeId: "ask_patient_name",
                onMatch: (_in, ctx) => { ctx.timeSlot = "02:00 PM"; },
            },
            {
                patterns: ["3", "evening", "5", "5:15"],
                targetNodeId: "ask_patient_name",
                onMatch: (_in, ctx) => { ctx.timeSlot = "05:15 PM"; },
            },
        ],
        fallbackText: "Please pick a valid time slot: reply *1* (09:30 AM), *2* (02:00 PM), or *3* (05:15 PM).",
        maxRetries: 2,
    },
    ask_patient_name: {
        id: "ask_patient_name",
        renderText: () => "👤 *Step 4 of 5: Patient Full Name*\n\n" +
            "Please provide the full legal name of the person who will be attending the appointment.",
        transitions: [
            {
                patterns: ["*"], // Wildcard captures full name
                targetNodeId: "confirm_summary",
                onMatch: (input, ctx) => {
                    ctx.patientName = input.trim();
                },
            },
        ],
        fallbackText: "Please reply with your full name to proceed with booking.",
        maxRetries: 2,
    },
    confirm_summary: {
        id: "confirm_summary",
        renderText: (ctx) => "📋 *Step 5 of 5: Please Review & Confirm*\n\n" +
            `• Patient: *${ctx.patientName || "N/A"}*\n` +
            `• Service: *${ctx.service || "General"}*\n` +
            `• Physician: *${ctx.doctor || "On Duty Doctor"}*\n` +
            `• Date: *${ctx.date || "TBD"}*\n` +
            `• Time: *${ctx.timeSlot || "TBD"}*\n` +
            `• Location: *MedCare Main Pavilion, Floor 2*\n\n` +
            "Would you like to finalize this reservation?\n" +
            "1️⃣ *Yes, Confirm Booking*\n" +
            "2️⃣ *Change Date & Time*\n" +
            "3️⃣ *Cancel & Discard*",
        transitions: [
            { patterns: ["1", "yes", "confirm", "ok", "book"], targetNodeId: "booking_success" },
            { patterns: ["2", "change", "edit", "reschedule"], targetNodeId: "choose_date" },
            { patterns: ["3", "cancel", "no", "discard"], targetNodeId: "welcome" },
        ],
        fallbackText: "Reply *1* to confirm booking, *2* to modify date/time, or *3* to cancel.",
        maxRetries: 2,
    },
    booking_success: {
        id: "booking_success",
        renderText: (ctx) => "🎉 *Appointment Confirmed!*\n\n" +
            `Your Reference Code: *${ctx.bookingId}*\n\n` +
            `📅 *Date:* ${ctx.date}\n` +
            `⏰ *Time:* ${ctx.timeSlot}\n` +
            `🩺 *Doctor:* ${ctx.doctor}\n` +
            `👤 *Patient:* ${ctx.patientName}\n\n` +
            "📌 *Important Instructions:*\n" +
            "• Please arrive 10 minutes prior to complete health screening.\n" +
            "• Bring any previous medical records or insurance cards.\n" +
            "• You will receive a WhatsApp reminder 2 hours before your appointment.\n\n" +
            "Need to make changes later? Simply message *'status'* or *'cancel'*.\n" +
            "Type *'menu'* to return to the main menu.",
        transitions: [
            { patterns: ["menu", "start", "restart"], targetNodeId: "welcome" },
            { patterns: ["receptionist", "agent", "human"], targetNodeId: "receptionist_handoff" },
        ],
        fallbackText: "Type *'menu'* to return to the main screen.",
        maxRetries: 2,
    },
    lookup_booking: {
        id: "lookup_booking",
        renderText: (ctx) => {
            if (ctx.bookingId) {
                return ("🔍 *Your Current Active Booking:*\n\n" +
                    `• Ref: *${ctx.bookingId}*\n` +
                    `• Patient: *${ctx.patientName}*\n` +
                    `• Service: *${ctx.service}*\n` +
                    `• Date & Time: *${ctx.date} at ${ctx.timeSlot}*\n` +
                    `• Status: *Active / Confirmed*\n\n` +
                    "Reply *'cancel'* if you need to cancel this appointment, or *'menu'* to return.");
            }
            return ("🔍 *No Active Bookings Found*\n\n" +
                "We could not locate an upcoming appointment linked to this WhatsApp account.\n\n" +
                "Reply *'1'* to book a new appointment, or *'menu'* to return to the home screen.");
        },
        transitions: [
            { patterns: ["1", "book", "new"], targetNodeId: "choose_service" },
            { patterns: ["cancel"], targetNodeId: "cancel_flow" },
            { patterns: ["menu", "back", "home"], targetNodeId: "welcome" },
        ],
        fallbackText: "Reply *'1'* to book an appointment, or *'menu'* to go back.",
        maxRetries: 2,
    },
    cancel_flow: {
        id: "cancel_flow",
        renderText: (ctx) => {
            if (!ctx.bookingId) {
                return ("ℹ️ You do not currently have any pending appointments to cancel.\n\n" +
                    "Reply *'menu'* to return to the main menu.");
            }
            return (`⚠️ *Are you sure you want to cancel appointment ${ctx.bookingId}?*\n\n` +
                `• Service: ${ctx.service}\n` +
                `• Scheduled for: ${ctx.date} at ${ctx.timeSlot}\n\n` +
                "Reply *'YES'* to cancel this booking, or *'NO'* to keep it.");
        },
        transitions: [
            {
                patterns: ["yes", "confirm", "cancel", "1"],
                targetNodeId: "welcome",
                onMatch: (_in, ctx) => {
                    ctx.bookingId = undefined;
                    ctx.service = undefined;
                    ctx.doctor = undefined;
                    ctx.date = undefined;
                    ctx.timeSlot = undefined;
                },
            },
            { patterns: ["no", "keep", "back", "2", "menu"], targetNodeId: "welcome" },
        ],
        fallbackText: "Reply *'YES'* to confirm cancellation, or *'NO'* to keep your reservation.",
        maxRetries: 2,
    },
    receptionist_handoff: {
        id: "receptionist_handoff",
        renderText: () => "🛎️ *Connecting to Clinic Receptionist...*\n\n" +
            "A staff member at MedCare Clinic has been alerted and will respond directly in this chat.\n\n" +
            "_(Office Hours: Mon–Sat 8:00 AM – 7:00 PM)_\n" +
            "Send *'menu'* at any time to reactivate the automated booking assistant.",
        transitions: [
            { patterns: ["menu", "bot", "restart", "start"], targetNodeId: "welcome" },
        ],
        fallbackText: "The receptionist will be with you shortly. Send *'menu'* to return to the bot.",
        maxRetries: 5,
    },
};
