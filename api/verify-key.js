export default async function handler(req, res) {
    // CORS Headers para pwede tawagin ng Roblox
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { key, hwid } = req.query;
    const API_KEY = process.env.PLATOBOOST_API_KEY;
    const ACCOUNT_ID = 23570;

    if (!key) {
        return res.status(400).json({ valid: false, error: "No key provided" });
    }

    try {
        // Tamang endpoint at request format para kay Platoboost
        const response = await fetch(`https://api.platoboost.com/v1/whitelist/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0' // Importante ito para hindi i-block ni Platoboost
            },
            body: JSON.stringify({
                "account_id": parseInt(ACCOUNT_ID),
                "key": key,
                "hwid": hwid || "UNKNOWN_HWID"
            })
        });

        // Kunin yung response
        const textData = await response.text();
        
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            return res.status(500).json({ valid: false, error: "Invalid response from Platoboost", raw: textData });
        }
        
        // I-return kung valid
        return res.status(200).json({ 
            valid: data.success === true || data.valid === true,
            raw: data
        });

    } catch (error) {
        return res.status(500).json({ valid: false, error: String(error) });
    }
}