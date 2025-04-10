const { Provider } = require('../../provider_api.js');
const { Client, Events, GatewayIntentBits, REST, Routes, Partials, AttachmentBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder} = require('discord.js');
const { log, LEVEL, MIN_LEVEL } = require('../../logger.js');
const axios = require('axios');

let ctrl;

class DiscordProvider extends Provider {
    constructor(config, ctrl) {
        super("discord", config);
        this.ctrl = ctrl;
        this.bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages], partials: [Partials.Message, Partials.Channel] });
        this.rest = new REST({ version: '10' }).setToken(config.token);
        this.bot.login(config.token);
        this.bot.on(Events.MessageCreate, (message) => this.messageCreateHandler(message));
        this.bot.on(Events.InteractionCreate, (interaction) => this.interactionHandler(interaction));
    }
    interactionHandler(interaction) {
        if(interaction.isChatInputCommand()) {
            ctrl.dispatchCommand(this.transformMessage(interaction, "command"));
        } else if(interaction.isButton()) {
            let transformed = this.transformMessage(interaction, "button");
            ctrl.dispatchCommand(transformed);
            // interaction.deferUpdate();
        }
    }
    messageCreateHandler(message) {
        // console.log(message);
        if(message.content[0] == this.config.prefix) {
            message.content = message.content.substr(1);
            ctrl.dispatchCommand(this.transformMessage(message, "command"));
        }
    }
    transformMessage(msg, type) {
        /*
            fuck
            {
                message: {
                    type: "text" | "photo" | "command",
                    content: string,
                    attachments: [ ... ] | false
                },
                author: {
                    username: "@xyz",
                    displayname: "Xyz",
                    id: "123456...",
                    is_owner: true | false
                }
            }
        */
        let user = msg.author || msg.user;
        let obj = {
            source: this.platform_name,
            reply: (text, attachments, buttons) => this.replyToMessage(this.platform_name, msg, text, attachments, buttons),
            message: {
                type,
                content: msg.content || msg.commandName || msg.customId,
                attachments: false
            },
            author: {
                username: user.username,
                displayname: user.globalName,
                id: user.id,
                is_owner: user.id == this.config.owner_id
            }
        }
        return obj;
    }
    async replyToMessage(source, msg, text, attachments=[], buttons=[]) { // (almost) everything to do with attachments is 1 for 1 copied from popcord because i cba to actually think right now
        if(source !== this.platform_name) return; // TODO: is silently failing the best option here?
        let options = {};
        options.content = text;
        if(buttons.length > 0) {
            const actionRow = new ActionRowBuilder();
            for(const btn of buttons) {
                if(!btn.label) {
                    log("Skipping button on message because it lacks a btn.label!", LEVEL.WARN);
                    continue;
                }
                if(!btn.action) {
                    log("Skipping button on message because it lacks a btn.action!", LEVEL.WARN);
                    continue;
                }
                const builder = new ButtonBuilder()
                    .setCustomId(btn.action)
                    .setLabel(btn.label)
                    .setStyle(ButtonStyle.Primary);
                actionRow.addComponents(builder);
            }
            options.components = [actionRow];
        }
        if(attachments.length > 0) {
            let attachment;
            //text = null;
            if(attachments.length > 1) log(`Only one attachment is supported at the moment for the Discord provider.`, LEVEL.WARN);
            let file = attachments[0];
            switch(typeof file) {
                case "string": // probably a URL to an external file, so we download it first using axios
                    log(`Downloading external attachment from "${file}".`, LEVEL.DEBUG);
				    let data = await axios(file, { responseType: "arraybuffer" });
				    attachment = Buffer.from(data.data, "binary");
				    break;
                case "object": // this is probably already a binary blob, good!
				    attachment = file; // hopefully this doesn't break (foreshadowing)
				    break;
            }
            options.files = [ {attachment} ];
            // console.log(options);
        }
        msg.reply(options);
    }
    async postPluginInit() {
        let commands = [];
        for(const command of ctrl.commands) {
            if(command[1].description == "[HIDDEN]") continue;
            commands.push({
                name: command[0],
                description: command[1].description
            });
        }
        await this.rest.put(Routes.applicationCommands(this.config.client_id), { body: commands });
    }
}

function entry(config, c) {
    ctrl = c;
    return new DiscordProvider(config, ctrl);
}

module.exports = entry;