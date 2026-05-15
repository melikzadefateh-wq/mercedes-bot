require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// Bot modülleri
require("./moderation")(client);
require("./guard")(client);
require("./welcome")(client);
require("./chat")(client);
require("./antiRaid")(client);

// Web panel
require("./dashboard");

client.once("ready", () => {
    console.log(`${client.user.tag} aktif`);
});

process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception:", err);
});

client.login(process.env.TOKEN);
