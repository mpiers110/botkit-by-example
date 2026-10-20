# Appointment Booking Bot

An example WhatsApp assistant for a fictional medical clinic. It helps patients book an appointment, check their booking, or reach the receptionist.

## Appointment flow

1. Choose a service and doctor.
2. Select a date and time.
3. Enter the patient's name and review the details.
4. Confirm the appointment to receive a reference code.

The main menu also includes options to check a booking, start a cancellation, or speak with the receptionist. The available services, prices, doctors, dates, and times are sample clinic details.

## Webhook endpoints

 * WhatsApp(FlareSend) -> **`/appointment-booking/webhooks/whatsapp`**
 * Telegram -> **`/appointment-booking/webhooks/telegram`**

For installation and deployment, see the project [setup guide](../SETUP.md).
