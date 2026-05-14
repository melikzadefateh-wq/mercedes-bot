const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: [
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Kullanıcıyı banlar.')
            .addUserOption(opt => opt.setName('hedef').setDescription('Banlanacak kişi').setRequired(true))
            .addStringOption(opt => opt.setName('sebep').setDescription('Neden banlanıyor?')),
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kullanıcıyı atar.')
            .addUserOption(opt => opt.setName('hedef').setDescription('Atılacak kişi').setRequired(true)),
        new SlashCommandBuilder()
            .setName('sil')
            .setDescription('Mesajları temizler.')
            .addIntegerOption(opt => opt.setName('sayi').setDescription('1-100 arası').setRequired(true))
    ],

    async execute(interaction) {
        const { commandName, options, guild } = interaction;

        if (commandName === 'ban') {
            const user = options.getUser('hedef');
            const reason = options.getString('sebep') || 'Belirtilmedi';
            const member = guild.members.cache.get(user.id);

            if (member && !member.bannable) return interaction.reply("❌ Yetkim bu kişiye yetmiyor.");
            
            await guild.members.ban(user, { reason });
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`unban_${user.id}`).setLabel('Banı Kaldır').setStyle(ButtonStyle.Danger)
            );
            return interaction.reply({ content: `✅ ${user.tag} banlandı.`, components: [row] });
        }

        if (commandName === 'kick') {
            const user = options.getUser('hedef');
            const member = guild.members.cache.get(user.id);
            if (!member || !member.kickable) return interaction.reply("❌ Bu kişiyi atamam.");
            await member.kick();
            return interaction.reply(`✅ ${user.tag} sunucudan atıldı.`);
        }

        if (commandName === 'sil') {
            const miktar = options.getInteger('sayi');
            await interaction.channel.bulkDelete(miktar, true);
            return interaction.reply({ content: `✅ ${miktar} mesaj silindi.`, ephemeral: true });
        }
    }
};

