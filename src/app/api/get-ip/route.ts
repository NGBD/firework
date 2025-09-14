import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
    const forwardedStandard = request.headers.get('forwarded'); // RFC 7239, e.g.: "for=1.2.3.4"
    
    let ip = 'Unknown';
    
    if (forwarded) {
      ip = forwarded.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp;
    } else if (cfConnectingIp) {
      ip = cfConnectingIp;
    } else if (vercelForwardedFor) {
      ip = vercelForwardedFor.split(',')[0].trim();
    } else if (forwardedStandard) {
      // Parse format "for=1.2.3.4" or "for=\"[2001:db8:cafe::17]\""
      const match = forwardedStandard.match(/for=([^;,]+)/i);
      if (match && match[1]) {
        ip = match[1]
          .replace(/^"|"$/g, '')
          .replace(/^\[/, '')
          .replace(/\]$/, '');
      }
    } else {
      // Fallback for development
      ip = '127.0.0.1';
    }

    // Get additional information
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Direct';
    const timestamp = new Date().toISOString();

    const ipInfo = {
      ip,
      userAgent,
      referer,
      timestamp,
      headers: {
        forwarded,
        realIp,
        cfConnectingIp,
        vercelForwardedFor,
        forwardedStandard
      }
    };

    return NextResponse.json(ipInfo);
  } catch (error) {
    console.error('Error getting IP:', error);
    return NextResponse.json(
      { error: 'Failed to get IP address' },
      { status: 500 }
    );
  }
}
