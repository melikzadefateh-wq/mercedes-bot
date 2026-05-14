
require('dotenv').config();
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Warn veritabanı (index.js ile senkronize kalması için basit bir nesne)
// Not: Bot kapanınca sıfırlanmaması için ileride bir veritabanı (json vb.) eklenebilir.
const db = new Map();
const SIYAH_RENK = 0x000000;

module.exports = {
    // Komutları tanımlayan dizi
    data: [
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Kullanıcıyı Mercedes Garajı\'ndan uzaklaştırır.')
            .addUserOption(opt => opt.setName('hedef').setDescription('Banlanacak kişi').setRequired(true))
            .addStringOption(opt => opt.setName('sebep').setDescription('Sebep').setRequired(true)),
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kullanıcıyı garajdan dışarı alır.')
            .addUserOption(opt => opt.setName('hedef').setDescription('Atılacak kişi').setRequired(true))
            .addStringOption(opt => opt.setName('sebep').setDescription('Sebep').setRequired(true)),
        new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Kullanıcıya uyarı verir.')
            .addUserOption(opt => opt.setName('hedef').setDescription('Uyarılacak kişi').setRequired(true))
            .addStringOption(opt => opt.setName('sebep').setDescription('Sebep').setRequired(true)),
    ],

    // Komutların çalışma mantığı
    async execute(interaction) {
        const { commandName, options, guild, user: yetkili } = interaction;
        const hedef = options.getMember('hedef');
        const sebep = options.getString('sebep');
        const tarih = new Date().toLocaleDateString('tr-TR');
        const saat = new Date().toLocaleTimeString('tr-TR');

        if (!hedef) return interaction.reply({ content: "Hedef bulunamadı.", ephemeral: true });

        // BAN
        if (commandName === 'ban') {
            const embed = new EmbedBuilder()
                .setColor(SIYAH_RENK)
                .setTitle(`${hedef.user.username} banlandı ★`)
                .setDescription(`|\n| Sebep: ${sebep}\n| Yetkili: ${yetkili.tag}\n| Tarih: ${tarih} ${saat}\n| User ID: ${hedef.id}\n|`);

            await interaction.reply({ embeds: [embed] });
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`unban_${hedef.id}`).setLabel('Ban Aç').setStyle(ButtonStyle.Danger));
            guild.channels.cache.get(process.env.BAN_LOG_ID).send({ embeds: [embed], components: [row] });
            await hedef.ban({ reason: sebep });
        }

        // KICK
        if (commandName === 'kick') {
            const embed = new EmbedBuilder()
                .setColor(SIYAH_RENK)
                .setTitle(`${hedef.user.username} kicklendi ★`)
                .setDescription(`|\n| Sebep: ${sebep}\n| Yetkili: ${yetkili.tag}\n| Tarih: ${tarih} ${saat}\n| User ID: ${hedef.id}\n|\n| Geri dönmek için: ${process.env.INVITE_LINK}\n|`);

            await interaction.reply({ embeds: [embed] });
            guild.channels.cache.get(process.env.KICK_LOG_ID).send({ embeds: [embed] });
            await hedef.kick(sebep);
        }

        // WARN
        if (commandName === 'warn') {
            let count = (db.get(hedef.id) || 0) + 1;
            db.set(hedef.id, count);

            if (count >= 3) {
                await interaction.reply(`${hedef.user} 3/3 uyarıdan dolayı banlandı!`);
                await hedef.ban({ reason: "3/3 Uyarı" });
                db.delete(hedef.id);
            } else {
                const embed = new EmbedBuilder()
                    .setColor(SIYAH_RENK)
                    .setTitle(`${hedef.user.username} uyarı aldı ⚠️`)
                    .setDescription(`|\n| Seviye: ${count}/3\n| Sebep: ${sebep}\n| Yetkili: ${yetkili.tag}\n| Tarih: ${tarih} ${saat}\n| User ID: ${hedef.id}\n|`);

                await interaction.reply({ embeds: [embed] });
                const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`unwarn_${hedef.id}`).setLabel('Warn Kaldır').setStyle(ButtonStyle.Secondary));
                guild.channels.cache.get(process.env.WARN_LOG_ID).send({ embeds: [embed], components: [row] });
            }
        }
    }
};

