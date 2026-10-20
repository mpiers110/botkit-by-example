# Onboarding Assistant

This is an assistant for onboarding and helping customers learn about services and request a project quote.

## What it does

- Shows a menu to browse services, start a project request, or ask for a human representative.
- Collects a customer's name, preferred service, and estimated timeline.
- Summarizes the request and offers a way to start over or ask for a person.

## Flow structure:
 - **`welcome`**: Greets user and presents main menu
 - **`services`**: Explains digital services
 - **`ask_name`**: Captures customer name for lead generation
 - **`ask_timeline`**: Asks project timeline
 - **`quote_summary`**: Confirms details, saves lead, and offers restart
 - **`agent_handoff`**: Connects to a human representative

Customers can type **menu** to return to the beginning or **agent** to request a human at any point.


## Webhook endpoints

 * WhatsApp(FlareSend) -> **`/onboarding-assistant/webhooks/whatsapp`**
 * Telegram -> **`/onboarding-assistant/webhooks/telegram`**

To install, run, or deploy the example, see [SETUP.md](../SETUP.md).
