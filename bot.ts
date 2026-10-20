import dotenv from 'dotenv';
import {BotkitGlobal, BotkitNode} from './types.js';
dotenv.config();

// ============================================================================
export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  MONGO_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shurubot",
  FLARESEND_API_KEY: process.env.FLARESEND_API_KEY || ""
};



// ============================================================================
// SHURUBOT CONVERSATIONAL FSM SPECIFICATION
// ============================================================================


/**
 * ShuruBot: A self-contained WhatsApp onboarding & service assistant.
 * Flow structure:
 *  - welcome: Greets user and presents main menu (1: Services, 2: Start Project, 3: Human Agent)
 *  - services: Explains digital services and lets user select one or return
 *  - ask_name: Captures customer name for lead generation
 *  - ask_timeline: Asks project timeline
 *  - quote_summary: Confirms details, saves lead, and offers restart
 *  - agent_handoff: Connects to a human representative
 */
export const shuruBotDefinition = {
  flowId: "shuruBot",
  version: 1,
  initialNodeId: "welcome",

  globals: [
    {
      id: "global_menu",
      patterns: ["menu", "start", "restart", "home", "hi", "hello", "shuru"],
      targetNodeId: "welcome",
      description: "Return to the main menu at any time",
    },
    {
      id: "global_agent",
      patterns: ["agent", "human", "support", "help", "representative", "talk to human"],
      targetNodeId: "agent_handoff",
      description: "Escalate to a human support agent",
    },
  ] as BotkitGlobal[],

  nodes: {
    welcome: {
      id: "welcome",
      text:
        "👋 *Welcome to ShuruBot!* \nYour automated WhatsApp assistant for getting started.\n\n" +
        "Please select an option:\n" +
        "1️⃣ *Services* — See what we offer\n" +
        "2️⃣ *Start Project* — Request a quotation\n" +
        "3️⃣ *Human Agent* — Talk to our team\n\n" +
        "_(Reply with 1, 2, or 3, or type 'help' anytime)_",
      transitions: [
        { patterns: ["1", "services", "offer", "info"], targetNodeId: "services" },
        { patterns: ["2", "start", "project", "quote", "begin"], targetNodeId: "ask_name" },
        { patterns: ["3", "agent", "human", "team"], targetNodeId: "agent_handoff" },
      ],
      fallbackText: "⚠️ Please reply with *1* (Services), *2* (Start Project), or *3* (Human Agent).",
      maxRetries: 3,
    },

    services: {
      id: "services",
      text:
        "🚀 *Our Core Services:*\n\n" +
        "• *Automated WhatsApp Bots* — Customer support & conversational commerce\n" +
        "• *API Integrations* — Flaresend, Stripe, CRM, and Webhook workflows\n" +
        "• *Custom Cloud Software* — Node.js, Express, and high-scale backends\n\n" +
        "Ready to begin?\n" +
        "• Reply *'start'* to begin a project request\n" +
        "• Reply *'menu'* to return to the main menu",
      transitions: [
        { patterns: ["start", "begin", "quote", "2", "yes"], targetNodeId: "ask_name" },
        { patterns: ["menu", "back", "home", "1"], targetNodeId: "welcome" },
      ],
      fallbackText: "Reply *'start'* to begin a quote, or *'menu'* to return to the main menu.",
      maxRetries: 2,
    },

    ask_name: {
      id: "ask_name",
      text: "Great! Let's get things moving. 📝\n\nWhat is your *full name*?",
      transitions: [
        {
          patterns: ["*"], // Wildcard pattern matches any customer name
          targetNodeId: "ask_service",
        },
      ],
      fallbackText: "Please provide your name so we know who we are speaking with.",
      maxRetries: 2,
    },

    ask_service: {
      id: "ask_service",
      text:
        "Thanks! Which service are you interested in?\n\n" +
        "1️⃣ WhatsApp Chatbot\n" +
        "2️⃣ API & Webhook Integration\n" +
        "3️⃣ Full-stack Cloud Development\n\n" +
        "_(Reply with 1, 2, or 3)_",
      transitions: [
        { patterns: ["1", "bot", "chatbot", "whatsapp"], targetNodeId: "ask_timeline" },
        { patterns: ["2", "api", "webhook", "integration"], targetNodeId: "ask_timeline" },
        { patterns: ["3", "cloud", "fullstack", "development"], targetNodeId: "ask_timeline" },
      ],
      fallbackText: "Please reply with *1* for WhatsApp Bot, *2* for API Integration, or *3* for Cloud Development.",
      maxRetries: 2,
    },

    ask_timeline: {
      id: "ask_timeline",
      text:
        "Got it! What is your estimated timeline for launch?\n\n" +
        "A) Within 2 weeks\n" +
        "B) Within 1 month\n" +
        "C) Just exploring / Flexible\n\n" +
        "_(Reply with A, B, or C)_",
      transitions: [
        { patterns: ["a", "2 weeks", "urgent", "1"], targetNodeId: "quote_summary" },
        { patterns: ["b", "1 month", "medium", "2"], targetNodeId: "quote_summary" },
        { patterns: ["c", "exploring", "flexible", "3"], targetNodeId: "quote_summary" },
      ],
      fallbackText: "Please choose *A* (2 weeks), *B* (1 month), or *C* (Flexible).",
      maxRetries: 2,
    },

    quote_summary: {
      id: "quote_summary",
      text:
        "🎉 *Thank you for contacting us!*\n\n" +
        "We have received your project details:\n" +
        "✅ Name: {{name}}\n" +
        "✅ Service: {{service}}\n" +
        "✅ Timeline: {{timeline}}\n\n" +
        "Our team will follow up on WhatsApp within 24 hours with a customized proposal.\n\n" +
        "Reply *'menu'* to start over or *'agent'* to chat with support now.",
      transitions: [
        { patterns: ["menu", "restart", "start"], targetNodeId: "welcome" },
        { patterns: ["agent", "human", "support"], targetNodeId: "agent_handoff" },
      ],
      fallbackText: "Reply *'menu'* to return to the home screen.",
      maxRetries: 2,
    },

    agent_handoff: {
      id: "agent_handoff",
      text:
        "👨‍💼 *Connecting you with a human specialist...*\n\n" +
        "A team member has been notified and will jump into this conversation shortly.\n\n" +
        "_(To return to the automated assistant at any time, simply send 'menu'.)_",
      transitions: [
        { patterns: ["menu", "bot", "restart"], targetNodeId: "welcome" },
      ],
      fallbackText: "A representative will be with you shortly. Send *'menu'* to switch back to the bot.",
      maxRetries: 5,
    },
  } as Record<string, BotkitNode>,
};

// ============================================================================
// CONVERSATION ENGINE (FSM EXECUTION)
// ============================================================================



