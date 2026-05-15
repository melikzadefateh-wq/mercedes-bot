const fs = require("fs");
const path = require("path");

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
} = require("discord.js");

const ui = require("./uiConfig");

const DB = path.join(__dirname, "warns.json");

let warns = fs.existsSync(DB)
    ? JSON.parse(fs.readFileSync(DB, "utf8"))
    : {};

function saveWarns() {
    fs.writeFileSync(DB, JSON.stringify(warns, null, 2));
}

function sendUI(text) {
    if (!ui.enabled || !ui.useEmbeds) {
        return { content: text };
    }

    return {
        embeds: [
            new EmbedBuilder()
                .setColor(ui.color)
                .setFooter({ text: ui.footer })
                .setDescription(text)
        ]
    };
}

async function sendLog(guild, channelId, payload) {
    const ch =
        guild.channels.cache.get(channelId) ||
        await guild.channels.fetch(channelId).catch(() => null);

    if (!ch) return;
    await ch.send(payload).catch(() => {});
}

module.exports = (client) => {

    /* ======================
       COMMAND REGISTER
    ====================== */

    client.once(Events.ClientReady, async () => {

        const cmds = [
            new SlashCommandBuilder()
                .setName("ban")
                .setDescription("Kullanıcıyı banlar")
                .addUserOption(o => o.setName("user").setDescription("Kullanıcı").setRequired(true))
                .addStringOption(o => o.setName("reason").setDescription("Sebep").setRequired(true))
                .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

            new SlashCommandBuilder()
                .setName("kick")
                .setDescription("Kullanıcıyı atar")
                .addUserOption(o => o.setName("user").setDescription("Kullanıcı").setRequired(true))
                .addStringOption(o => o.setName("reason").setDescription("Sebep").setRequired(true))
                .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

            new SlashCommandBuilder()
                .setName("warn")
                .setDescription("Uyarı verir")
                .addUserOption(o => o.setName("user").setDescription("Kullanıcı").setRequired(true))
                .addStringOption(o => o.setName("reason").setDescription("Sebep").setRequired(true))
        ];

        await client.application.commands.set(cmds);
        console.log("🚗 Moderation hazır");
    });

    /* ======================
       INTERACTIONS
    ====================== */

    client.on(Events.InteractionCreate, async (interaction) => {

        if (!interaction.guild) return;

        const now = new Date();
        const tarih = now.toLocaleDateString("tr-TR");
        const saat = now.toLocaleTimeString("tr-TR");

        /* ======================
           BUTTONS
        ====================== */

        if (interaction.isButton()) {

            if (interaction.customId.startsWith("unban_")) {
                const id = interaction.customId.split("_")[1];

                await interaction.guild.members.unban(id).catch(() => {});

                return interaction.reply({
                    content: "✅ Ban kaldırıldı",
                    flags: 64
                });
            }

            if (interaction.customId.startsWith("warnreset_")) {
                const id = interaction.customId.split("_")[1];

                warns[id] = 0;
                saveWarns();

                return interaction.reply({
                    content: "⚠ Warn sıfırlandı",
                    flags: 64
                });
            }
        }

        if (!interaction.isChatInputCommand()) return;

        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const mod = interaction.user.tag;

        /* ======================
           BAN
        ====================== */

        if (interaction.commandName === "ban") {

            await interaction.guild.members.ban(user, { reason });

            await interaction.reply(
                sendUI(`⛔ **KULLANICI BANLANDI**\n\n${user} sunucudan uzaklaştırıldı.`)
            );

            await user.send(
                sendUI(`
Mercedes-Benz Moderation System

Merhaba ${user},

Sunucudan uzaklaştırıldınız.

Sebep: ${reason}
Yetkili: ${mod}
Tarih: ${tarih} ${saat}
`)
            ).catch(() => {});

            const log = sendUI(`
MODERATION LOG

Action: BAN
User: ${user.tag}
Reason: ${reason}
Moderator: ${mod}
Date: ${tarih} ${saat}
UserID: ${user.id}
`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`unban_${user.id}`)
                    .setLabel("Banı Kaldır")
                    .setStyle(ButtonStyle.Success)
            );

            return sendLog(interaction.guild, process.env.BAN_LOG_ID, {
                ...log,
                components: [row]
            });
        }

        /* ======================
           KICK
        ====================== */

        if (interaction.commandName === "kick") {

            if (!member) {
                return interaction.reply({
                    content: "Kullanıcı bulunamadı",
                    flags: 64
                });
            }

            await member.kick(reason);

            await interaction.reply(
                sendUI(`⛔ **KULLANICI ATILDI**\n\n${user} sunucudan atıldı.`)
            );

            await user.send(
                sendUI(`
Mercedes-Benz Moderation System

Merhaba ${user},

Sunucudan atıldınız.

Sebep: ${reason}
Yetkili: ${mod}
Tarih: ${tarih} ${saat}
`)
            ).catch(() => {});

            const log = sendUI(`
MODERATION LOG

Action: KICK
User: ${user.tag}
Reason: ${reason}
Moderator: ${mod}
Date: ${tarih} ${saat}
`);

            return sendLog(interaction.guild, process.env.KICK_LOG_ID, log);
        }

        /* ======================
           WARN SYSTEM
        ====================== */

        if (interaction.commandName === "warn") {

            let count = warns[user.id] || 0;
            count++;
            warns[user.id] = count;
            saveWarns();

            if (count >= 3) {

                warns[user.id] = 0;
                saveWarns();

                await interaction.guild.members.ban(user, { reason: "3 Warn" });

                return interaction.reply(
                    sendUI(`⛔ **OTOMATİK BAN**\n\n${user} 3 warn nedeniyle banlandı.`)
                );
            }

            await interaction.reply(
                sendUI(`⚠ **WARN VERİLDİ**\n\n${user}\nDurum: ${count}/3`)
            );

            await user.send(
                sendUI(`
Mercedes-Benz Moderation System

Size uyarı verildi.

Sebep: ${reason}
Yetkili: ${mod}
Uyarı: ${count}/3
`)
            ).catch(() => {});

            const log = sendUI(`
MODERATION LOG

Action: WARN
User: ${user.tag}
Reason: ${reason}
Moderator: ${mod}
Warn: ${count}/3
Date: ${tarih} ${saat}
`);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`warnreset_${user.id}`)
                    .setLabel("Warn Sıfırla")
                    .setStyle(ButtonStyle.Success)
            );

            return sendLog(interaction.guild, process.env.WARN_LOG_ID, {
                ...log,
                components: [row]
            });
        }
    });
};
