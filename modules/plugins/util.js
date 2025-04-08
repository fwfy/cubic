let ctrl;

function init(env, cobj) {
    ctrl = cobj;
    ctrl.registerCommand("help", commandHelp, "Shows a list of commands.");
}

function commandHelp(cmd, args, msg) {
    let helptext = `Available commands:\n`;
    for(const c of ctrl.commands) {
        let name = c[0];
        let info = c[1];
        helptext += `- ${name}: ${info.alias ? "Alias of " + info.aliasOf : info.description}\n`;
    }
    msg.reply(helptext);
}

module.exports = init;