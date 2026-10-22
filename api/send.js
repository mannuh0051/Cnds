import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { 
      return res.status(400).json({ error: "Malformed JSON", raw: body }); 
    }
  }
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: "Empty request body" });
  }

  const { name, email } = body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  const VERIFY_SECRET = '56416838f8b7d9d5df276e221bd0d235ccc5e70a7e6e87f8';
  const SITE_HOST = 'migrationscanada.cfd'; 
  
  const expiry = Math.floor(Date.now() / 1000) + 86400;
  const payloadObj = { e: email, n: name, x: expiry };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto.createHmac('sha256', VERIFY_SECRET).update(payloadB64).digest('hex');
  
  const link = `https://${SITE_HOST}/verify.php?t=${payloadB64}.${sig}`;

  const html = `
<div style='font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 40px 10px;'>
  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>
    <div style='background: #111827; padding: 25px; text-align: center; border-bottom: 4px solid #d71a2f;'>
      <h1 style='color: #ffffff; margin: 0; font-size: 22px;'>MIGRATION CANADA</h1>
    </div>
    <div style='padding: 40px 30px;'>
      <h2 style='color: #111827; margin-top: 0;'>Welcome to your portal, ${name}</h2>
      <p style='color: #475569; font-size: 15px; line-height: 1.6;'>
        Thank you for completing the initial eligibility assessment. Your profile has been processed and your next steps are ready.
      </p>
      <div style='text-align: center; margin: 35px 0;'>
        <a href='${link}' style='background: #d71a2f; color: #ffffff; text-decoration: none; padding: 16px 35px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;'>
          Access Secure Portal &rarr;
        </a>
      </div>
      <p style='color: #64748b; font-size: 13px; text-align: center;'>This portal login link will expire in 24 hours.</p>
    </div>
  </div>
</div>`;

  const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_YOUR_ACTUAL_KEY_HERE';
  const RESEND_SENDER_EMAIL = 'guide@migrationscanada.cfd';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Migration Canada <${RESEND_SENDER_EMAIL}>`,
        to: [email],
        subject: 'Action Required: Access Your Migration Canada Portal',
        html: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend Error:', data);
      return res.status(500).json({ ok: false, message: data.message || 'Failed to send email' });
    }

    return res.status(200).json({ ok: true, message: 'Email sent' });
  } catch (err) {
    console.error('Fetch Error:', err);
    return res.status(500).json({ ok: false, message: 'Network error sending email' });
  }
}
