# Setup

## Requirements

- Node.js
- pnpm
- A MongoDB database
- A Flaresend API key

## Run locally

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Create a `.env` file in the project folder:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   FLARESEND_API_KEY=your_flaresend_api_key
   ```

3. Start the development server:

   ```sh
   pnpm dev
   ```

The server runs at `http://localhost:3000`.

## Deploy

Deploy the project to a Node.js host that can run a web server. Set `MONGODB_URI` and `FLARESEND_API_KEY` in the host's environment settings, then use:

- Build command: `pnpm build`
- Start command: `pnpm start`

Once deployed, configure your WhatsApp provider to send webhooks to `https://your-domain/webhook`.
