const ui = require("./uiConfig");
const { EmbedBuilder } = require("discord.js");

function makeEmbed(text) {
    if (!ui.enabled || !ui.useEmbeds) {
        return { content: text }; // eski sistem
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

function makeLog(text) {
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

module.exports = {
    makeEmbed,
    makeLog,
    ui
};
