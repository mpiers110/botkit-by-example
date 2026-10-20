import { APPOINTMENT_FLOW } from "../flow.js";
import { AppointmentPersistence } from "./persistence.js";
// ============================================================================
export class AppointmentBookingEngine {
    /**
     * Helper to match patterns (case-insensitive, trims, wildcard '*' support)
     */
    static matchPatterns(input, patterns) {
        const clean = input.trim().toLowerCase();
        for (const p of patterns) {
            if (p === "*")
                return clean.length > 0;
            if (clean === p.toLowerCase())
                return true;
            if (clean.includes(p.toLowerCase()))
                return true;
        }
        return false;
    }
    /**
     * Processes a single turn of conversation, transitioning currentState -> nextState.
     * Demonstrates full state tracking:
     *  - currentState -> nextState
     *  - context variable mutations
     *  - retry count tracking
     *  - active/completed/handoff status lifecycle
     */
    static async runTurn(waUserId, inboundText) {
        const rawInput = inboundText.trim();
        let currentState = await AppointmentPersistence.loadState(waUserId);
        // Initial State Generation on first contact
        if (!currentState) {
            const initialNode = APPOINTMENT_FLOW["welcome"];
            const initialState = {
                waUserId,
                flowId: "appointmentBooking",
                flowVersion: 1,
                currentNodeId: "welcome",
                context: { phone: waUserId },
                retryCount: 0,
                status: "active",
                lastInboundText: rawInput,
                lastTransitionAt: new Date(),
                updatedAt: new Date(),
            };
            await AppointmentPersistence.saveState(initialState);
            return {
                outboundText: initialNode.renderText(initialState.context),
                nextState: initialState,
                hasTransitioned: true,
            };
        }
        // Clone into nextState
        const nextState = {
            ...currentState,
            context: { ...currentState.context },
            lastInboundText: rawInput,
            updatedAt: new Date(),
        };
        // 1. GLOBAL INTERRUPT MATCHING (High Priority)
        const globals = [
            { patterns: ["menu", "restart", "start", "home", "shuru"], target: "welcome" },
            { patterns: ["agent", "human", "receptionist", "support", "help"], target: "receptionist_handoff" },
            { patterns: ["status", "check booking", "my appointment"], target: "lookup_booking" },
        ];
        for (const g of globals) {
            if (this.matchPatterns(rawInput, g.patterns)) {
                const targetNode = APPOINTMENT_FLOW[g.target];
                nextState.currentNodeId = targetNode.id;
                nextState.retryCount = 0;
                nextState.status = targetNode.id === "receptionist_handoff" ? "handoff" : "active";
                nextState.lastTransitionAt = new Date();
                await AppointmentPersistence.saveState(nextState);
                return {
                    outboundText: targetNode.renderText(nextState.context),
                    nextState,
                    hasTransitioned: true,
                };
            }
        }
        // 2. FETCH CURRENT ACTIVE NODE
        const currentNode = APPOINTMENT_FLOW[nextState.currentNodeId] || APPOINTMENT_FLOW["welcome"];
        // 3. MATCH LOCAL TRANSITIONS ON CURRENT NODE
        let matchedTransition = null;
        for (const transition of currentNode.transitions) {
            if (this.matchPatterns(rawInput, transition.patterns)) {
                matchedTransition = transition;
                break;
            }
        }
        // 4. TRANSITION SUCCESSFUL -> ADVANCE nextState
        if (matchedTransition) {
            // Execute any context-mutating callbacks on match
            if (matchedTransition.onMatch) {
                matchedTransition.onMatch(rawInput, nextState.context);
            }
            const targetNodeId = matchedTransition.targetNodeId;
            const targetNode = APPOINTMENT_FLOW[targetNodeId];
            if (targetNode) {
                // If transitioning to booking_success, generate booking record
                if (targetNodeId === "booking_success") {
                    const bookingCode = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
                    nextState.context.bookingId = bookingCode;
                    nextState.context.bookingTimestamp = Date.now();
                    nextState.status = "completed";
                    // Persist confirmed booking in database
                    await AppointmentPersistence.saveBooking({
                        bookingId: bookingCode,
                        waUserId: nextState.waUserId,
                        patientName: nextState.context.patientName || "Patient",
                        service: nextState.context.service || "General Care",
                        doctor: nextState.context.doctor || "Clinic Physician",
                        date: nextState.context.date || "Scheduled Date",
                        timeSlot: nextState.context.timeSlot || "Scheduled Time",
                        status: "confirmed",
                    });
                }
                else if (targetNodeId === "receptionist_handoff") {
                    nextState.status = "handoff";
                }
                else {
                    nextState.status = "active";
                }
                nextState.currentNodeId = targetNode.id;
                nextState.retryCount = 0;
                nextState.lastTransitionAt = new Date();
                await AppointmentPersistence.saveState(nextState);
                return {
                    outboundText: targetNode.renderText(nextState.context),
                    nextState,
                    hasTransitioned: true,
                };
            }
        }
        // 5. INPUT VALIDATION FAILED -> RETRY LOGIC OR ESCALATION
        nextState.retryCount += 1;
        if (nextState.retryCount > currentNode.maxRetries) {
            // Exceeded max attempts: Escalate to receptionist
            const escalateNode = APPOINTMENT_FLOW["receptionist_handoff"];
            nextState.currentNodeId = escalateNode.id;
            nextState.status = "handoff";
            nextState.retryCount = 0;
            nextState.lastTransitionAt = new Date();
            await AppointmentPersistence.saveState(nextState);
            return {
                outboundText: "⚠️ I didn't quite catch that after multiple attempts.\n\n" +
                    escalateNode.renderText(nextState.context),
                nextState,
                hasTransitioned: true,
            };
        }
        // Still within retry allowance: Stay on current node and send fallback guidance
        await AppointmentPersistence.saveState(nextState);
        return {
            outboundText: currentNode.fallbackText,
            nextState,
            hasTransitioned: false,
        };
    }
}
