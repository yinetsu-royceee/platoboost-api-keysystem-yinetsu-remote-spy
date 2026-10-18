export default async function handler(req, res) {
    // Set CORS para pwede tawagin ng Roblox script
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Dito natin ilalagay ang logic para kumuha ng Platoboost Link
    // Sa ngayon, test muna natin kung gumagana yung Vercel
    return res.status(200).json({ 
        status: "success", 
        message: "Vercel API is working!",
        account_id: 23570
    });
}
