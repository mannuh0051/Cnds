export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = "pk_-phQ7tCvHCXPmMbvk1xFxNAyLnbkmgFM"; 
  const channelId = "PAYL-3WZA62";

  // --- HANDLE POST (STK PUSH) ---
  if (req.method === 'POST') {
    let body = req.body;
    
    // Force parsing if Vercel didn't do it automatically
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { 
        return res.status(400).json({ error: "Malformed JSON", raw: body }); 
      }
    }
    
    // Check if body exists
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "Empty request body" });
    }

    const { phone, amount, reference, description } = body;

    if (!phone || !amount || !reference) {
      return res.status(400).json({ error: 'Missing fields', received: body });
    }

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

  // --- HANDLE GET (STATUS CHECK) ---
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
