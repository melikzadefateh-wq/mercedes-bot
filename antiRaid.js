const { Events, EmbedBuilder } = require("discord.js");

const joinTracker = new Map();
const raidState = new Map();

const THRESHOLD = Number(process.env.ANTI_RAID_THRESHOLD || 6);     // kaç girişte alarm
const WINDOW_MS = Number(process.env.ANTI_RAID_WINDOW_MS || 10000); // kaç saniye içinde
const LOCK_MS = Number(process.env.ANTI_RAID_LOCK_MS || 300000);    // raid modu kaç ms sürsün

async function sendLog(guild, channelId, payload) {
    try {
        if (!channelId) return;

        const channel =
            guild.channels.cache.get(channelId) ||
            await guild.channels.fetch(channelId).catch(() => null);

        if (!channel) {
            console.log("ANTI-RAID LOG KANALI BULUNAMADI:", channelId);
            return;
        }

        await channel.send(payload).catch((err) => {
            console.log("ANTI-RAID LOG GÖNDERİLEMEDİ:", err.message);
        });
    } catch (err) {
        console.log("ANTI-RAID LOG HATASI:", err.message);
    }
}

function isWhitelisted(member) {
    const roleId = process.env.WHITELIST_ROLE_ID;
    if (!roleId) return false;
    return member.roles.cache.has(roleId);
}

module.exports = (client) => {
    client.on(Events.GuildMemberAdd, async (member) => {
        if (!member.guild) return;
        if (member.user.bot) return;

        const guildId = member.guild.id;
        const now = Date.now();
        const raidUntil = raidState.get(guildId) || 0;

        const logChannelId = process.env.ANTI_RAID_LOG_ID;

        // Raid modu aktifse, whitelist dışındakileri banla
        if (raidUntil > now) {
            if (isWhitelisted(member)) return;

            await member.ban({ reason: "Anti-raid lockdown active" }).catch(() => {});

            const logEmbed = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`
ANTI-RAID LOG

Action: AUTO BAN
User: ${member.user.tag}
UserID: ${member.user.id}
Reason: Raid mode active
Date: ${new Date().toLocaleString("tr-TR")}
`);

            await sendLog(member.guild, logChannelId, { embeds: [logEmbed] });
            return;
        }

        // Girişleri takip et
        let joins = joinTracker.get(guildId) || [];
        joins = joins.filter((t) => now - t <= WINDOW_MS);
        joins.push(now);
        joinTracker.set(guildId, joins);

        // Eşik aşılırsa raid modu aç
        if (joins.length >= THRESHOLD) {
            raidState.set(guildId, now + LOCK_MS);

            const alertEmbed = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`
ANTI-RAID ALERT

Status: RAID MODE ACTIVATED
Count: ${joins.length}/${THRESHOLD}
Window: ${WINDOW_MS / 1000}s
Lock Duration: ${LOCK_MS / 1000}s
Date: ${new Date().toLocaleString("tr-TR")}
`);

            await sendLog(member.guild, logChannelId, { embeds: [alertEmbed] });

            // Bu gelen kişi de whitelist değilse banla
            if (!isWhitelisted(member)) {
                await member.ban({ reason: "Anti-raid threshold exceeded" }).catch(() => {});

                const bannedEmbed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setDescription(`
ANTI-RAID LOG

Action: AUTO BAN
User: ${member.user.tag}
UserID: ${member.user.id}
Reason: Threshold exceeded
Date: ${new Date().toLocaleString("tr-TR")}
`);

                await sendLog(member.guild, logChannelId, { embeds: [bannedEmbed] });
            }

            return;
        }
    });

    // Hafif temizlik
    setInterval(() => {
        const now = Date.now();

        for (const [guildId, times] of joinTracker.entries()) {
            const filtered = times.filter((t) => now - t <= WINDOW_MS);
            if (filtered.length === 0) joinTracker.delete(guildId);
            else joinTracker.set(guildId, filtered);
        }

        for (const [guildId, until] of raidState.entries()) {
            if (until <= now) raidState.delete(guildId);
        }
    }, 60_000).unref();
};
