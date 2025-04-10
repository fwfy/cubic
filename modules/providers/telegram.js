const { Provider } = require('../../provider_api.js');
const TelegramBot = require('node-telegram-bot-api');
const { log, LEVEL, MIN_LEVEL } = require('../../logger.js');

let ctrl;

class TelegramProvider extends Provider {
    constructor(config, ctrl) {
        super("telegram", config);
        this.ctrl = ctrl;
        this.bot = new TelegramBot(config.token, { polling: true });
        this.bot.on('message', (msg) => this.inboundHandler(msg));
        this.bot.on('callback_query', (msg) => {
            this.bot.answerCallbackQuery({callback_query_id: msg.id});
            this.inboundHandler({text: this.config.prefix+msg.data, chat: msg.message.chat, from: msg.from},true);
        });
    }
    inboundHandler(msg) {
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
        if(!msg.text) return; // TODO: handle other types
        let type = msg.text[0] == this.config.prefix ? "command" : "text";
        let message = this.transformMessage(msg);
        if(type == "command") {
            try {
                this.ctrl.dispatchCommand(message, this);
            } catch(err) {
                log(`Failed to dispatch a command!\n${err.stack}`, LEVEL.ERROR);
            }
        } else if(type == "message") {
            try {
                this.ctrl.dispatchMessage(message, this);
            } catch(err) {
                log(`Failed to dispatch a message!\n\t${err}`, LEVEL.ERROR);
            }
        }
    }
    transformMessage(msg, type) {
        let obj = {
            source: this.platform_name,
            reply: (text, attachments, buttons) => this.replyToMessage(this.platform_name, msg.chat.id, text, attachments, buttons),
            message: {
                type: type,
                content: msg.text,
                attachments: false
            },
            author: {
                username: msg.from.username,
                displayname: msg.from.first_name,
                id: msg.from.id,
                is_owner: msg.from.id == this.config.owner_id
            },
            platform_specific: {
                channel: {
                    type: msg.chat.type,
                    id: msg.chat.id,
                    title: msg.chat.title
                }
            }
        }
        return obj;
    }
    replyToMessage(source, id, text, attachments=[], buttons=[]) {
        if(source !== this.platform_name) return; // TODO: is silently failing the best option here?
        let dest = id;
        let msg_opts = {};
        if(buttons.length > 0) {
            let inline_keyboard = [[]];
            for(const button of buttons) {
                inline_keyboard[0].push({
                    text: button.label,
                    callback_data: button.action
                });
            }
            msg_opts.reply_markup = JSON.stringify({inline_keyboard});
        }
        if(attachments.length > 0) {
            if(attachments.length > 1) log(`Only one attachment is supported at the moment for the Telegram provider.`, LEVEL.WARN);
            msg_opts.caption = text;
            this.bot.sendPhoto(dest, attachments[0], msg_opts);
        } else {
            this.bot.sendMessage(dest, text, msg_opts);
        }
    }
}

function entry(config, c) {
    ctrl = c;
    return new TelegramProvider(config, ctrl);
}

module.exports = entry;