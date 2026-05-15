const { Events, EmbedBuilder } = require("discord.js");

const spamMap = new Map();

const SPAM_LIMIT = 5;
const SPAM_WINDOW_MS = 5000;

async function sendGuardLog(guild, payload) {
    const channelId = process.env.GUARD_LOG_ID;
    if (!channelId) return;

    try {
        const channel =
            guild.channels.cache.get(channelId) ||
            await guild.channels.fetch(channelId).catch(() => null);

        if (!channel) {
            console.log("GUARD LOG KANALI BULUNAMADI:", channelId);
            return;
        }

        await channel.send(payload).catch((err) => {
            console.log("GUARD LOG GÖNDERİLEMEDİ:", err.message);
        });
    } catch (err) {
        console.log("GUARD LOG HATASI:", err.message);
    }
}

function isWhitelisted(member) {
    const roleId = process.env.WHITELIST_ROLE_ID;
    if (!roleId) return false;
    return member?.roles?.cache?.has(roleId) || false;
}

module.exports = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        try {
            if (!message.guild) return;
            if (message.author.bot) return;

            if (isWhitelisted(message.member)) return;

            const content = message.content.toLowerCase().trim();
            const now = Date.now();

            // Spam takibi
            if (!spamMap.has(message.author.id)) {
                spamMap.set(message.author.id, []);
            }

            const timestamps = spamMap.get(message.author.id);
            timestamps.push(now);

            const recent = timestamps.filter((t) => now - t <= SPAM_WINDOW_MS);
            spamMap.set(message.author.id, recent);

            if (recent.length >= SPAM_LIMIT) {
                await message.delete().catch(() => {});

                await sendGuardLog(message.guild, {
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setDescription(
                                `GUARD LOG\n\nAction: SPAM BLOCK\nUser: ${message.author.tag}\nUserID: ${message.author.id}\nChannel: ${message.channel}\nDate: ${new Date().toLocaleString("tr-TR")}`
                            )
                    ]
                });

                spamMap.delete(message.author.id);
                return;
            }

            // Link / invite engeli
            const blockedPatterns = [
                "http://",
                "https://",
                "discord.gg/",
                "discord.com/invite/"
            ];

            if (blockedPatterns.some((p) => content.includes(p))) {
                await message.delete().catch(() => {});

                await sendGuardLog(message.guild, {
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setDescription(
                                `GUARD LOG\n\nAction: LINK BLOCK\nUser: ${message.author.tag}\nUserID: ${message.author.id}\nChannel: ${message.channel}\nContent: Link silindi\nDate: ${new Date().toLocaleString("tr-TR")}`
                            )
                    ]
                });

                return;
            }

            // Basit küfür filtresi
            const badWords = [
                "amk",
                "aq",
                "oç",
                "piç",
                "salak",
                "aptal"
            ];

            if (badWords.some((w) => content.includes(w))) {
                await message.delete().catch(() => {});

                await sendGuardLog(message.guild, {
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setDescription(
                                `GUARD LOG\n\nAction: BAD WORD BLOCK\nUser: ${message.author.tag}\nUserID: ${message.author.id}\nChannel: ${message.channel}\nDate: ${new Date().toLocaleString("tr-TR")}`
                            )
                    ]
                });

                return;
            }

        } catch (err) {
            console.log("GUARD MESSAGE ERROR:", err.message);
        }
    });
};
