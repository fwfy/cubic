let ctrl;

function init(env, cobj) {
    ctrl = cobj;
    ctrl.registerCommand("hello", commandHelloWorld, "What good would a bot be without a nice, old-fashioned 'Hello, world!' command?", ["hi", "greetings"]);
    ctrl.registerCommand("debug", commandDebug, `Replies with some information about the initiating message.`);
}

function commandHelloWorld(cmd, args, msg) {
    msg.reply("Hello, world!");
}

function commandDebug(cmd, args, msg) {
    msg.reply(`Information about this message:\nArguments: ${args.join(', ')}\nYour ID: ${msg.author.id}\nBot Owner: ${msg.author.is_owner}\nProvider Module: ${msg.source}`);
}

module.exports = init;