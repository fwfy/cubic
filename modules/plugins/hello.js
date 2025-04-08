let ctrl;

function init(env, cobj) {
    ctrl = cobj;
    ctrl.registerCommand("hello", commandHelloWorld, "What good would a bot be without a nice, old-fashioned 'Hello, world!' command?", ["hi", "greetings"]);
    ctrl.registerCommand("debug", commandDebug, `Replies with some information about the initiating message.`);
    ctrl.registerCommand("burger", commandBurger, `borgoir`);
}

function commandHelloWorld(cmd, args, msg) {
    msg.reply("Hello, world!");
}

function commandDebug(cmd, args, msg) {
    msg.reply(`Information about this message:\nArguments: ${args.join(', ')}\nYour ID: ${msg.author.id}\nBot Owner: ${msg.author.is_owner}\nProvider Module: ${msg.source}`);
}

function commandBurger(cmd, args, msg) {
    msg.reply(`Eat Borgir`, [`https://files.fwfy.club/files/button.png`]);
}

module.exports = init;