const E621 = require('e621');
const crypto = require('node:crypto');
const { log, LEVEL } = require("@fwfy/cubic-logger");
let e621, ctrl, p_config;
let cache = new Map();

async function lookup(tags) {
    tags = tags.join(" ");
    log(`Looking up "${tags}"`, LEVEL.DEBUG);
    let result;
    let hash = crypto.createHash("sha1").update(tags).digest('hex');
    if (cache.has(hash)) {
        let cache_item = cache.get(hash);
        log(`Cache hit! Expiry in ${1800000 - (Date.now() - cache_item.createdAt)}ms.`, LEVEL.DEBUG);
        if (Date.now() - cache_item.createdAt > 1800000) {
            cache.delete(hash);
        }
        result = cache_item.data;
    } else {
        log(`Cache miss!`, LEVEL.DEBUG);
        result = await e621.posts.search({
            tags: tags,
            limit: 320
        });
        cache.set(hash, {data: result, createdAt: Date.now()});
    }
    return result;
}

function init(env, cobj, pconf) {
    ctrl = cobj;
    p_config = pconf;
    e621 = new E621({
        authUser: p_config.auth_user,
        authKey: p_config.auth_key
    });
    ctrl.registerCommand("e621", commandE621, "Fetch and display an E621 post.", ["e6", "yiff", "esix"]);
}

async function commandE621(cmd, args, msg) {
    let tags = args;
    if (!tags.includes("-video")) {
        tags.push("-video");
    }
    if (!tags.some(e => e.includes("order:"))) {
        tags.push("order:score");
    }
    let posts = await lookup(tags);
    let post = posts[Math.floor(Math.random() * posts.length)];
    let post_url = post.file.url;
    msg.reply(`Search: ${tags.join(", ")}`, [post_url], [{ label: "🔁", action: `e621 ${tags.join(" ")}` }]);
}

module.exports = init;