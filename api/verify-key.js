export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, hwid } = req.query; 
    const API_KEY = process.env.PLATOBOOST_API_KEY;
    const ACCOUNT_ID = 23570;

    if (!key) {
        return res.status(400).json({ valid: false, error: "No key provided" });
    }

    try {
        // Dito natin tatawagin ang Platoboost API
        const response = await fetch(`https://api.platoboost.com/v1/whitelist/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "account_id": ACCOUNT_ID,
                "key": key,
                "hwid": hwid || "TEST_HWID"
            })
        });

        const data = await response.json();
        
        return res.status(200).json({ 
            valid: data.success === true || data.valid === true,
            raw_response: data
        });

    } catch (error) {
        return res.status(500).json({ valid: false, error: String(error) });
    }
}