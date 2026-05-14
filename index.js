const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Render'ın uyumasını engelleyen servis
app.get('/', (req, res) => res.send('Mercedes Bot 7/24 Aktif!'));
app.listen(port, () => console.log(`[SİSTEM] Port ${port} aktif.`));

require('dotenv').config();
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const moderation = require('./moderation.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// KOMUTLARI DISCORD'A KAYDET
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: moderation.data.map(cmd => cmd.toJSON()) },
        );
        console.log('✅ Komutlar başarıyla yüklendi!');
    } catch (error) { console.error('❌ Yükleme Hatası:', error); }
})();

// YETKİ KONTROLÜ (Senin ID'n veya Yönetici olanlar)
function yetkiVarMi(member) {
    return member.id === process.env.SAHIP_ID || member.permissions.has(PermissionFlagsBits.Administrator);
}

// OTO ROL & HOŞ GELDİN
client.on(Events.GuildMemberAdd, async member => {
    const rolId = process.env.OTO_ROL_ID;
    const rol = member.guild.roles.cache.get(rolId);
    if (rol) member.roles.add(rol).catch(e => console.log("Rol verme hatası:", e.message));

    const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`Hoş Geldin ${member.user.username}! 🚗`)
        .setDescription(`**${member.guild.name}** garajına hoş geldin!`);
    
    member.send({ embeds: [embed] }).catch(() => {});
});

// ETKİLEŞİMLER (BAN/KICK ÇALIŞTIRAN KISIM)
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (!yetkiVarMi(interaction.member)) {
            return interaction.reply({ content: "❌ Bu komutu kullanmak için yetkin yok!", ephemeral: true });
        }
        await moderation.execute(interaction);
    }

    // BAN KALDIRMA BUTONU
    if (interaction.isButton()) {
        if (!yetkiVarMi(interaction.member)) return;
        const [act, uid] = interaction.customId.split('_');
        if (act === 'unban') {
            await interaction.guild.members.unban(uid);
            await interaction.update({ content: `✅ Ban kaldırıldı.`, components: [] });
        }
    }
});

client.login(process.env.TOKEN);

