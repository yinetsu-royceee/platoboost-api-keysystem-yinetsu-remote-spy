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

    if (!SECRET) {
        return res.status(500).json({ valid: false, error: "Missing PLATOBOOST_HMAC_SECRET in Vercel" });
    }

    try {
        const payload = `${ACCOUNT_ID}:${key}:${hwid || "UNKNOWN"}`;
        const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

        const targetUrl = "https://api.platoboost.com/v1/whitelist/validate";
        
        // Listahan ng mga proxies na susubukan natin isa-isa
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://api.cors.lol/?url=${encodeURIComponent(targetUrl)}`,
            `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(targetUrl)}`
        ];

        const fetchOptions = {
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
        };

        let responseText = "";
        let success = false;

        // Loop para subukan lahat ng proxy hanggang may mag-success
        for (let proxy of proxies) {
            try {
                const response = await fetch(proxy, fetchOptions);
                const text = await response.text();
                
                // Kung "Rate limit" o "Error 522" (Proxy issues), skip at subukan yung susunod
                if (text.includes("Rate limit") || text.includes("522") || text.includes("Error 403") || text.includes("keyless_legacy_url")) {
                    continue; 
                }
                
                responseText = text;
                success = true;
                break; // Gumana! Stop na sa pag-loop
                
            } catch (err) {
                continue; // Kung nag-fail yung fetch, try next proxy
            }
        }

        if (!success) {
            return res.status(200).json({ valid: false, error: "All proxies are currently rate-limited. Please try again later." });
        }

        // I-parse yung result
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return res.status(200).json({ valid: false, raw_text: responseText });
        }
        
        return res.status(200).json({ 
            valid: data.success === true || data.valid === true,
            raw: data
        });

    } catch (error) {
        return res.status(500).json({ valid: false, error: "Fetch Error: " + String(error) });
    }
}