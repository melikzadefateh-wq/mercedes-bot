const { Events } = require("discord.js");

/* ======================
   CHAT AUTO REPLY
====================== */

module.exports = (client) => {

    client.on(Events.MessageCreate, async (message) => {

        if (!message.guild) return;
        if (message.author.bot) return;

        const msg = message.content.toLowerCase();

        /* ======================
           SELAMLAŞMA
        ====================== */

        const greetings = [
            "sa",
            "as",
            "selam",
            "selamünaleyküm",
            "selamun aleyküm",
            "merhaba",
            "mrb",
            "hey"
        ];

        if (greetings.includes(msg)) {

            return message.reply(
                "Aleykümselam 🚗 Mercedes Garajına hoş geldin"
            );
        }

        /* ======================
           KÜÇÜK VIBE MESAJLAR
        ====================== */

        if (msg === "iyi" || msg === "iyiyim") {
            return message.reply("İyi gitmesine sevindik 😎 Gaz devam 🚗");
        }

        if (msg === "naber" || msg === "nbr") {
            return message.reply("Garaj full gazda 🔥 sen ne yapıyorsun?");
        }

        if (msg.includes("mercedes")) {
            return message.reply("Yıldız hep parıldar ⭐🚗");
        }

    });
};
