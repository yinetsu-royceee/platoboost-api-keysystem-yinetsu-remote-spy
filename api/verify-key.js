import crypto from 'crypto';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, hwid } = req.query;
    const SECRET = process.env.PLATOBOOST_HMAC_SECRET;
    const ACCOUNT_ID = "23570";

    if (!key) {
        return res.status(400).json({ valid: false, error: "No key provided" });
    }

    try {
        const payload = `${ACCOUNT_ID}:${key}:${hwid || "UNKNOWN"}`;
        const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

        // DIDIRETSO TAYO KAY PLATOBOOST (Walang Proxy)
        const targetUrl = "https://api.platoboost.com/v1/whitelist/validate";

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SECRET}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'X-Signature': signature
            },
            body: JSON.stringify({
                "account_id": parseInt(ACCOUNT_ID),
                "key": key,
                "hwid": hwid || "UNKNOWN"
            })
        });

        const textData = await response.text();
        
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            return res.status(200).json({ valid: false, raw_text: textData });
        }
        
        return res.status(200).json({ 
            valid: data.success === true || data.valid === true,
            raw: data
        });

    } catch (error) {
        return res.status(500).json({ valid: false, error: "Fetch Error: " + String(error) });
    }
}