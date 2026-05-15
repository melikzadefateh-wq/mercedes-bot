const { Events, EmbedBuilder } = require("discord.js");

module.exports = (client) => {
    client.on(Events.GuildMemberAdd, async (member) => {
        const roleId = process.env.OTO_ROL_ID;
        const logId = process.env.WELCOME_LOG_ID;

        const user = member.user;
        const guild = member.guild;
        const time = new Date().toLocaleString("tr-TR");

        if (roleId) {
            const role = guild.roles.cache.get(roleId);
            if (role) {
                await member.roles.add(role).catch(() => {});
            }
        }

        const dmEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(
                `**Mercedes-Benz Moderation System**\n\nGazı kökledik ${user} 🚗💨\n\n${guild.name} garajına hoş geldin.\nBurada motor sesi, modifiye muhabbeti ve yarış ruhu var.\n\nKuralları #kurallar kanalında okumayı unutma.\nYavaş kalanı sollarız 😎`
            );

        await user.send({ embeds: [dmEmbed] }).catch(() => {});

        const welcomeChannel =
            guild.systemChannel ||
            guild.channels.cache.find((c) =>
                c.isTextBased() && (
                    c.name.includes("genel") ||
                    c.name.includes("chat") ||
                    c.name.includes("sohbet")
                )
            );

        if (welcomeChannel) {
            await welcomeChannel.send(
                `🚗 Hoş geldin ${user}\nGaraja yeni bir araç giriş yaptı!`
            ).catch(() => {});
        }

        if (logId) {
            const logChannel =
                guild.channels.cache.get(logId) ||
                (await guild.channels.fetch(logId).catch(() => null));

            if (logChannel) {
                await logChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setDescription(
                                `WELCOME LOG\n\nUser: ${user.tag}\nUserID: ${user.id}\nGuild: ${guild.name}\nDate: ${time}`
                            )
                    ]
                }).catch(() => {});
            }
        }
    });
};
