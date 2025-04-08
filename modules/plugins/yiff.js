const E621 = require('e621');
let e621, ctrl, p_config;

function init(env, cobj, pconf) {
    ctrl = cobj;
    p_config = pconf;
    e621 = new E621({
        authUser: p_config.auth_user,
        authKey: p_config.auth_key
    });
    ctrl.registerCommand("e6id", commandPostById, "Fetch and display an E621 post by its ID.", ["e6post", "esixpost"]);
}

function commandPostById(cmd, args, msg) {
    
}

module.exports = init;