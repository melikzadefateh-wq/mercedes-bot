const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// RENDER UPTIME SERVİSİ (Botun kapanmaması için)
app.get('/', (req, res) => res.send('Mercedes Bot 7/24 Aktif!'));
app.listen(port, () => console.log(`[UPTIME] ${port} portu üzerinden yayında.`));

// DISCORD BOT KODLARI
require('dotenv').config();
const { Client, GatewayIntentBits, Events, REST, Routes, EmbedBuilder } = require('discord.js');
const moderation = require('./moderation.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const SIYAH_RENK = 0x000000;

// KOMUTLARI KAYDET
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: moderation.data.map(cmd => cmd.toJSON()) },
        );
        console.log('✅ Moderasyon komutları yüklendi!');
    } catch (error) { 
        console.error('❌ Komut yükleme hatası:', error); 
    }
})();

// YETKİ KONTROLÜ
function yetkiVarMi(member) {
    return member.id === process.env.SAHIP_ID || member.roles.cache.has(process.env.ROLE_ID);
}

// MESAJ EVENTİ (SA-AS)
client.on(Events.MessageCreate, m => {
    if (m.author.bot) return;
    const selamlar = ["sa", "as", "merhaba", "selam", "selamünaleyküm"];
    if (selamlar.includes(m.content.toLowerCase())) {
        m.reply("Aleykümselam! Yıldızın daima parlasın, garaja hoş geldin. ✨🚘");
    }
});

// OTO ROL & HOŞ GELDİN
client.on(Events.GuildMemberAdd, async member => {
    const rol = member.guild.roles.cache.get(process.env.OTO_ROL_ID);
    if (rol) member.roles.add(rol).catch(() => {});

    const embed = new EmbedBuilder()
        .setColor(SIYAH_RENK)
        .setTitle(`Gazı kökledik ${member.user.username} 🚗💨`)
        .setDescription(`**${member.guild.name}** garajına hoş geldin.\n\nKuralları incelemeyi unutma.\n\n*Yavaş gitmek mi? Bizde sadece vites yükseltmek var!*`)
        .setThumbnail(member.user.displayAvatarURL());
    
    member.send({ embeds: [embed] }).catch(() => {});
});

// ETKİLEŞİMLER
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (!yetkiVarMi(interaction.member)) return interaction.reply({ content: "Bu komutu kullanmak için yetkin yok!", ephemeral: true });
        await moderation.execute(interaction);
    }

    if (interaction.isButton()) {
        if (!yetkiVarMi(interaction.member)) return interaction.reply({ content: "Yetkin yok!", ephemeral: true });
        const [act, uid] = interaction.customId.split('_');
        
        if (act === 'unban') {
            await interaction.guild.members.unban(uid);
            await interaction.update({ content: `✅ Ban Açıldı | İşleyen: ${interaction.user.tag}`, embeds: [], components: [] });
        }
    }
});

// GUARD'I BAĞLA
try { require('./guard.js')(client); } catch (e) { console.log("Guard dosyası bulunamadı, atlanıyor."); }

client.login(process.env.TOKEN);

