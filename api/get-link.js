export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Ibinabalik niya yung link ng gateway mo
    return res.status(200).json({ 
        status: "success", 
        link: "https://gateway.platoboost.com/a/23570" 
    });
}