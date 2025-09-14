import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ip, userAgent, timestamp } = await request.json();

    // Input validation
    if (!ip || typeof ip !== 'string') {
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400 }
      );
    }
    if (!userAgent || typeof userAgent !== 'string') {
      return NextResponse.json(
        { error: 'Invalid User Agent' },
        { status: 400 }
      );
    }
    if (!timestamp || typeof timestamp !== 'string') {
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    const toUtc7String = (isoString: string) => {
      const date = new Date(isoString);
      const utc7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dd = pad(utc7.getUTCDate());
      const mm = pad(utc7.getUTCMonth() + 1);
      const yyyy = utc7.getUTCFullYear();
      const hh = pad(utc7.getUTCHours());
      const min = pad(utc7.getUTCMinutes());
      const ss = pad(utc7.getUTCSeconds());
      return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} UTC+7`;
    };

    const formattedTime = toUtc7String(timestamp);

    // Escape Markdown characters to prevent parsing errors
    const lamTextAnToan = (text: string) => {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/\\/g, '\\\\')  // Escape backslash first
        .replace(/\*/g, '\\*')   // Escape asterisks
        .replace(/_/g, '\\_')    // Escape underscores
        .replace(/\[/g, '\\[')   // Escape square brackets
        .replace(/\]/g, '\\]')   // Escape square brackets
        .replace(/\(/g, '\\(')   // Escape parentheses
        .replace(/\)/g, '\\)')   // Escape parentheses
        .replace(/~/g, '\\~')    // Escape tildes
        .replace(/`/g, '\\`')    // Escape backticks
        .replace(/>/g, '\\>')    // Escape greater than
        .replace(/#/g, '\\#')    // Escape hash
        .replace(/\|/g, '\\|')   // Escape pipe
        .replace(/\{/g, '\\{')   // Escape curly braces
        .replace(/\}/g, '\\}');  // Escape curly braces
    };

    let countryText = '';
    let ispText = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const geoRes = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo && geo.success) {
          const country = geo.country || '';
          const code = geo.country_code || '';
          countryText = country ? `${country}${code ? ` (${code})` : ''}` : '';

          const connection = geo.connection || {};
          const isp = connection.isp || '';
          const org = connection.org || geo.org || '';
          const asn = connection.asn || '';
          const parts: string[] = [];
          if (isp) parts.push(isp);
          if (org && org !== isp) parts.push(org);
          if (asn) parts.push(`AS${asn}`);
          ispText = parts.join(' / ');
        }
      }
    } catch (_) {
    }

    const message = `🔍 **IP Tracker Alert**\n\n` +
      `📍 **IP Address:** \`${ip}\`\n` +
      (countryText ? `🌎 **Country:** ${lamTextAnToan(countryText)}\n` : '') +
      (ispText ? `🏷 **ISP:** ${lamTextAnToan(ispText)}\n` : '') +
      `🕐 **Time:** ${lamTextAnToan(formattedTime)}\n` +
      `📱 **User Agent:** ${lamTextAnToan(userAgent)}`;

    // Send message with fallback parse_mode to prevent errors
    let telegramResponse;
    try {
      // Try sending with Markdown first
      telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );

      // If Markdown fails, retry without parse_mode
      if (!telegramResponse.ok) {
        const errorData = await telegramResponse.json();
        if (errorData.error_code === 400 && errorData.description.includes('parse entities')) {
          console.log('Markdown parsing failed, retrying without parse_mode...');
          telegramResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: message.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, ''), // Remove Markdown syntax
                parse_mode: undefined,
              }),
            }
          );
        }
      }
    } catch (error) {
      console.error('Error in Telegram request:', error);
      throw error;
    }

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Telegram API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send to Telegram' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return NextResponse.json(
      { error: 'Failed to send to Telegram' },
      { status: 500 }
    );
  }
}
