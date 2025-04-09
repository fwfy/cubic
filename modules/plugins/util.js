let ctrl;

function init(env, cobj) {
    ctrl = cobj;
    ctrl.registerCommand("help", commandHelp, "Shows a list of commands.");
    ctrl.registerCommand("eval", commandEval, "Evaluate an expression (Bot owner only)");
    ctrl.registerCommand("ptset", commandPrefTestSet, "Sets a test value in your user preferences store.");
    ctrl.registerCommand("ptget", commandPrefTestGet, "Gets the test value from your user preferences store.");
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

function commandEval(cmd, args, msg) {
    if(!msg.author.is_owner) return msg.reply("Error: This command can only be executed by the owner of the bot!");
    let out = "";
    try {
        out = eval(args.join(" "));
    } catch(err) {
        out = err;
    }
    if(out?.toString().trim() == "" || typeof out == "undefined") {
        out = "(Eval result was empty)";
    }
    msg.reply(out);
}

function commandPrefTestSet(cmd, args, msg) {
    ctrl.get_exposed("udata.set_pref")(msg.source, msg.author.id, "test_preference", args[0]);
    msg.reply("Your test preference has been saved!");
}

function commandPrefTestGet(cmd, args, msg) {
    let pref = ctrl.get_exposed("udata.get_pref")(msg.source, msg.author.id, "test_preference");
    if(typeof pref == "undefined") {
        msg.reply("Your test preference hasn't been set yet!");
    } else {
        msg.reply(`Your test preference is currently set to "${pref}".`);
    }
}

module.exports = init;