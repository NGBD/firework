import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ip, userAgent, timestamp } = await request.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram configuration missing' },
        { status: 500 }
      );
    }

    // Định dạng thời gian về dd/mm/yyyy hh:mm:ss UTC+7
    const toUtc7String = (isoString: string) => {
      const date = new Date(isoString);
      // Chuyển sang UTC+7: cộng 7 giờ theo milliseconds
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

    // Tra cứu quốc gia từ IP (sử dụng ipwho.is - không cần API key)
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
      // Bỏ qua nếu tra cứu thất bại
    }

    // Hàm escape Markdown characters - chỉ escape những ký tự thực sự gây lỗi
    const escapeMarkdown = (text: string) => {
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
        // Bỏ escape cho: +, -, =, ., ! vì chúng không gây lỗi parsing
    };

    // Tạo message với thông tin IP (bỏ Referer và URL)
    const message = `🔍 **IP Tracker Alert**\n\n` +
      `📍 **IP Address:** \`${ip}\`\n` +
      (countryText ? `🌎 **Country:** ${escapeMarkdown(countryText)}\n` : '') +
      (ispText ? `🏷 **ISP:** ${escapeMarkdown(ispText)}\n` : '') +
      `🕐 **Time:** ${escapeMarkdown(formattedTime)}\n` +
      `📱 **User Agent:** ${escapeMarkdown(userAgent)}`;

    // Gửi message đến Telegram
    const telegramResponse = await fetch(
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
