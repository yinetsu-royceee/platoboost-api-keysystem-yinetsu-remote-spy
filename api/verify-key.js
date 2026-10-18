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
        // Gumawa ng HMAC Signature base sa C# logic
        const payload = `${ACCOUNT_ID}:${key}:${hwid || "UNKNOWN"}`;
        const signature = HMAC_SECRET ? crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex') : "";

        // Yung totoong endpoint ni Platoboost (hula natin, pero we'll try)
        const targetUrl = "https://api.platoboost.com/v1/whitelist/validate";
        
        // Gagamit tayo ng PROXY para hindi ma-block ni Platoboost ang IP ni Vercel
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        // Tatawagin natin yung proxy na magfoforward ng request kay Platoboost
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
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

        // Kunin yung sagot
        const textData = await response.text();
        
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            return res.status(200).json({ valid: false, raw_text: textData });
        }
        
        // I-return kung success
        return res.status(200).json({ 
            valid: data.success === true || data.valid === true,
            raw: data
        });

    } catch (error) {
        return res.status(500).json({ valid: false, error: "Proxy Error: " + String(error) });
    }
}