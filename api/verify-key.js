import crypto from 'crypto';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, hwid } = req.query;
    const API_KEY = process.env.PLATOBOOST_API_KEY;
    const HMAC_SECRET = process.env.PLATOBOOST_HMAC_SECRET;
    const ACCOUNT_ID = "23570";

    if (!key) {
        return res.status(400).json({ valid: false, error: "No key provided" });
    }

    try {
        // Gumawa ng HMAC signature base sa Platoboost API requirements
        // (Ito yung sikreto para tanggapin tayo ng server nila)
        const timestamp = Date.now().toString();
        const payload = `${ACCOUNT_ID}:${key}:${hwid || "UNKNOWN"}`;
        
        let signature = "";
        if (HMAC_SECRET) {
            signature = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
        }

        // Tawagin ang Platoboost API
        const response = await fetch(`https://api.platoboost.com/v1/whitelist/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'X-Signature': signature,
                'X-Timestamp': timestamp
            },
            body: JSON.stringify({
                "account_id": parseInt(ACCOUNT_ID),
                "key": key,
                "hwid": hwid || "UNKNOWN"
            })
        });

        const textData = await response.text();
        
        // Subukang i-parse kung JSON, kung hindi, ibalik as text
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            return res.status(200).json({ valid: false, error: "Invalid response from Platoboost", raw: textData });
        }
        
        return res.status(200).json({ 
            valid: data.success === true || data.valid === true,
            raw: data
        });

    } catch (error) {
        return res.status(500).json({ valid: false, error: "Fetch Error: " + String(error) });
    }
}