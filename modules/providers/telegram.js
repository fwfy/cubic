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
                log(`Failed to dispatch a command!\n\t${err}`, LEVEL.ERROR);
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
            reply: (text) => this.replyToMessage(this.platform_name, msg.chat.id, text),
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
    replyToMessage(source, id, text) {
        if(source !== this.platform_name) return; // TODO: is silently failing the best option here?
        let dest = id;
        this.bot.sendMessage(dest, text);
    }
}

function entry(config, c) {
    ctrl = c;
    return new TelegramProvider(config, ctrl);
}

module.exports = entry;