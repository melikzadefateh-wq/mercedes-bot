const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;

const loginUrl =
    `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20guilds`;

async function handleCallback(code) {
    const tokenRes = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI
        }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://discord.com/api/users/@me", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const guildsRes = await axios.get("https://discord.com/api/users/@me/guilds", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const user = userRes.data;
    const guilds = guildsRes.data || [];
    const allowed = GUILD_ID ? guilds.some((g) => g.id === GUILD_ID) : true;

    return { user, guilds, allowed };
}

module.exports = {
    loginUrl,
    handleCallback
};
