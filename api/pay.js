export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.PAYLOR_API_KEY || "pk_-phQ7tCvHCXPmMbvk1xFxNAyLnbkmgFM"; 
  const channelId = process.env.PAYLOR_CHANNEL_ID || "PAYL-3WZA62";

  if (req.method === 'POST') {
    const { phone, amount, reference, description } = req.body || {};
    if (!phone || !amount || !reference) return res.status(400).json({ error: 'Missing fields' });

    try {
      const response = await fetch('https://api.paylorke.com/api/v1/merchants/payments/stk-push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, amount, reference, channelId, description })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Paylor error');
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    const { transactionId } = req.query;
    if (!transactionId) return res.status(400).json({ error: 'Missing ID' });

    try {
      const response = await fetch(`https://api.paylorke.com/api/v1/merchants/payments/transactions/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Query failed');
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
