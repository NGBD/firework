# IP Tracker - Next.js Application

A Next.js web application to collect visitor IP addresses and send information to Telegram.

## Features

- ✅ Automatically collect visitor IP addresses
- ✅ Gather additional information (User Agent, Referer, Timestamp)
- ✅ Send information to Telegram Bot
- ✅ Beautiful and responsive interface
- ✅ Display notification sending status

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Telegram Bot:**
   
   a. Create new bot:
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Send command `/newbot`
   - Set name and username for bot
   - Save the **Bot Token**

   b. Get Chat ID:
   - Message the newly created bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find `chat.id` in the response

3. **Create `.env.local` file:**
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

5. **Visit:** `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── get-ip/route.ts      # API to get IP
│   │   └── send-telegram/route.ts # API to send to Telegram
│   └── page.tsx                 # Main page
```

## API Endpoints

### GET `/api/get-ip`
Get visitor IP address and additional information.

**Response:**
```json
{
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "referer": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/send-telegram`
Send IP information to Telegram.

**Body:**
```json
{
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "referer": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Notes

- The application automatically collects IP when users visit the homepage
- Information is sent immediately to Telegram
- Can be deployed to Vercel, Netlify or other platforms
- Ensure correct environment variables configuration when deploying

## Troubleshooting

1. **Not receiving Telegram notifications:**
   - Check Bot Token and Chat ID
   - Ensure bot has been started (send `/start` to bot)
   - Check console for errors

2. **IP display is inaccurate:**
   - In development environment, IP might be localhost
   - When deployed, IP will display correctly

3. **CORS errors:**
   - Next.js API routes don't have CORS issues
   - If errors occur, check server configuration