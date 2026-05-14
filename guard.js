require('dotenv').config();
const { EmbedBuilder, Events } = require('discord.js');

// Basit uyarı takibi (Bot kapanınca sıfırlanır)
const guardDB = new Map(); 
const SIYAH_RENK = 0x000000;
const WHITELIST_ROLE_ID = "1504232038897553498";

module.exports = (client) => {
    
    async function uyarıSistemi(member, sebep, miktar, message) {
        let count = (guardDB.get(member.id) || 0) + miktar;
        guardDB.set(member.id, count);

        const logKanali = message.guild.channels.cache.get(process.env.WARN_LOG_ID);
        
        const embed = new EmbedBuilder()
            .setColor(SIYAH_RENK)
            .setTitle(`${member.user.username} Güvenlik Duvarına Takıldı 🛡️`)
            .setDescription(`|\n| **Ceza:** ${miktar} Uyarı\n| **Sebep:** ${sebep}\n| **Toplam:** ${count}/3\n|`);

        if (count >= 3) {
            await member.ban({ reason: "Guard: 3/3 Uyarı Limiti" }).catch(() => {});
            if (logKanali) logKanali.send({ content: `🚫 **${member.user.tag}** güvenlik sınırını aştığı için banlandı.` });
            guardDB.delete(member.id);
        } else {
            if (logKanali) logKanali.send({ embeds: [embed] });
            message.channel.send(`⚠️ ${member.user}, yaptığın kural dışı hareketten dolayı **${miktar}** uyarı aldın! (${count}/3)` )
                .then(msg => setTimeout(() => msg.delete(), 5000));
        }
    }

    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot || !message.guild) return;
        
        // Whitelist veya Sahip muafiyeti
        if (message.member.roles.cache.has(WHITELIST_ROLE_ID) || message.author.id === process.env.SAHIP_ID) return;

        const content = message.content.toLowerCase();

        // 1. KÜFÜR ENGELLEYİCİ (1 WARN)
        const kufurler = ["amk", "oç", "piç", "sik", "dalyarak", "pipi"]; 
        if (kufurler.some(kelime => content.includes(kelime))) {
            if (message.deletable) await message.delete();
            return uyarıSistemi(message.member, "Küfür/Argo Kullanımı", 1, message);
        }

        // 2. LİNK / DAVET ENGELLEYİCİ (2 WARN)
        const linkPattern = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)|(http|https):\/\//g;
        if (linkPattern.test(content)) {
            if (message.deletable) await message.delete();
            return uyarıSistemi(message.member, "Link veya Reklam Paylaşımı", 2, message);
        }
    });

    console.log("🛡️ Guard Sistemi Motoru Çalıştırıldı!");
};

