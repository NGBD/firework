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

    // Tạo message với thông tin IP
    // Định dạng thời gian sang UTC+7 dd/mm/yyyy HH:mm:ss nếu nhận được ISO
    let formattedTime = timestamp;
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        const parts = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Bangkok',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).formatToParts(date);
        const get = (type: string) => parts.find(p => p.type === type)?.value || '';
        formattedTime = `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}:${get('second')} UTC+7`;
      }
    } catch {}

    const message = `🔍 **IP Tracker Alert**\n\n` +
      `📍 **IP Address:** \`${ip}\`\n` +
      `🕐 **Time:** ${formattedTime}\n` +
      `📱 **User Agent:** ${userAgent}`;

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
