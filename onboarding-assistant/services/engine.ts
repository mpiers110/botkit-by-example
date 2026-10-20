import { TransitionOutcome } from "../types.js";
import { ONBOARDING_FLOW } from "../flow.js";
import { Persistence } from "./persistence.js";

export class OnboardingAssistantEngine {
  /**
   * Matches inbound message against a list of pattern strings (case-insensitive, trimmed).
   * Supports wildcard "*" which matches any non-empty string.
   */
  private static matchPatterns(input: string, patterns: string[]): boolean {
    const clean = input.trim().toLowerCase();
    for (const p of patterns) {
      if (p === "*") return clean.length > 0;
      if (clean === p.toLowerCase()) return true;
      if (clean.includes(p.toLowerCase())) return true;
    }
    return false;
  }

  /**
   * Executes one turn of conversation state transition for the given WhatsApp user.
   */
  static async processMessage(
    waUserId: string,
    inboundText: string
  ): Promise<TransitionOutcome> {
    const rawInput = inboundText.trim();
    let state = await Persistence.load(waUserId);

    // Initial state creation if first contact
    if (!state) {
      state = {
        waUserId,
        flowId: ONBOARDING_FLOW.flowId,
        flowVersion: ONBOARDING_FLOW.version,
        currentNodeId: ONBOARDING_FLOW.initialNodeId,
        context: {},
        retryCount: 0,
        status: "active",
        updatedAt: new Date(),
      };
      await Persistence.save(state);

      // Return the welcome message
      const initialNode = ONBOARDING_FLOW.nodes[ONBOARDING_FLOW.initialNodeId];
      return {
        outboundText: initialNode.text,
        nextState: state,
      };
    }

    // 1. Check Global Interrupts (highest priority: "menu", "agent", etc.)
    for (const global of ONBOARDING_FLOW.globals) {
      if (this.matchPatterns(rawInput, global.patterns)) {
        const targetNode = ONBOARDING_FLOW.nodes[global.targetNodeId];
        if (targetNode) {
          state.currentNodeId = targetNode.id;
          state.retryCount = 0;
          state.status = targetNode.id === "agent_handoff" ? "handoff" : "active";

          // Format template variables if any
          const text = this.interpolate(targetNode.text, state.context);
          await Persistence.save(state);
          return { outboundText: text, nextState: state };
        }
      }
    }

    // 2. Fetch Current Active Node
    const currentNode =
      ONBOARDING_FLOW.nodes[state.currentNodeId] ||
      ONBOARDING_FLOW.nodes[ONBOARDING_FLOW.initialNodeId];

    // Capture context specific to stages
    if (state.currentNodeId === "ask_name" && rawInput.length > 0) {
      state.context.name = rawInput;
    } else if (state.currentNodeId === "ask_service") {
      if (rawInput === "1" || rawInput.toLowerCase().includes("bot")) {
        state.context.service = "WhatsApp Chatbot";
      } else if (rawInput === "2" || rawInput.toLowerCase().includes("api")) {
        state.context.service = "API & Webhook Integration";
      } else {
        state.context.service = "Full-stack Cloud Development";
      }
    } else if (state.currentNodeId === "ask_timeline") {
      if (rawInput.toLowerCase().startsWith("a") || rawInput === "1") {
        state.context.timeline = "Within 2 weeks";
      } else if (rawInput.toLowerCase().startsWith("b") || rawInput === "2") {
        state.context.timeline = "Within 1 month";
      } else {
        state.context.timeline = "Flexible";
      }
    }

    // 3. Match Local Transitions on Current Node
    let matchedTargetId: string | null = null;
    for (const transition of currentNode.transitions) {
      if (this.matchPatterns(rawInput, transition.patterns)) {
        matchedTargetId = transition.targetNodeId;
        break;
      }
    }

    // 4. Successful Transition
    if (matchedTargetId) {
      const nextNode = ONBOARDING_FLOW.nodes[matchedTargetId];
      if (nextNode) {
        state.currentNodeId = nextNode.id;
        state.retryCount = 0;
        state.status = nextNode.id === "agent_handoff" ? "handoff" : "active";

        const text = this.interpolate(nextNode.text, state.context);
        await Persistence.save(state);
        return { outboundText: text, nextState: state };
      }
    }

    // 5. Fallback & Retry Logic
    state.retryCount += 1;
    if (state.retryCount > currentNode.maxRetries) {
      // Exceeded max retries: Escalate to agent
      const agentNode = ONBOARDING_FLOW.nodes["agent_handoff"];
      state.currentNodeId = "agent_handoff";
      state.status = "handoff";
      state.retryCount = 0;
      await Persistence.save(state);

      return {
        outboundText:
          "⚠️ I'm having trouble understanding your response.\n\n" +
          agentNode.text,
        nextState: state,
      };
    }

    // Still within allowed retries: Send node's fallback prompt
    await Persistence.save(state);
    return {
      outboundText: currentNode.fallbackText,
      nextState: state,
    };
  }

  /**
   * Simple string template interpolator: replaces `{{key}}` with context[key]
   */
  private static interpolate(text: string, context: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return context[key] !== undefined ? String(context[key]) : `[${key}]`;
    });
  }
}