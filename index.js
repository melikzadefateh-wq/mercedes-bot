
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
    } catch (error) { console.error(error); }
})();

// YETKİ KONTROLÜ
function yetkiVarMi(member) {
    return member.id === process.env.SAHIP_ID || member.roles.cache.has(process.env.ROLE_ID);
}

// MESAJ EVENTİ (SA-AS & MERHABA)
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
        .setDescription(`**${member.guild.name}** garajına hoş geldin.\n\nKuralları incelemeyi unutma.\n***Yavaş kalanı sollarız*** 😎`);
    member.send({ embeds: [embed] }).catch(() => {});
});

// ETKİLEŞİMLER (KOMUTLARI MODERATION.JS'DEN ÇEKER)
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (!yetkiVarMi(interaction.member)) return interaction.reply({ content: "Yetkin yok!", ephemeral: true });
        await moderation.execute(interaction);
    }
    
    // BUTONLAR (BAN AÇMA / WARN SIFIRLAMA)
    if (interaction.isButton()) {
        if (!yetkiVarMi(interaction.member)) return interaction.reply({ content: "Yetkin yok!", ephemeral: true });
        const [act, uid] = interaction.customId.split('_');
        if (act === 'unban') {
            await interaction.guild.members.unban(uid);
            await interaction.update({ content: `✅ Ban Açıldı | İşleyen: ${interaction.user.tag}`, embeds: [], components: [] });
        }
        if (act === 'unwarn') {
            // Not: Basit Map yapısında db moderation.js içinde olduğu için oradan yönetilir.
            await interaction.update({ content: `✅ Uyarılar Sıfırlandı | İşleyen: ${interaction.user.tag}`, embeds: [], components: [] });
        }
    }
});

// GUARD'I BAĞLA (Eğer varsa)
try { require('./guard.js')(client); } catch (e) {}

client.login(process.env.TOKEN);

