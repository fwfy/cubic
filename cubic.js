const { log, LEVEL, MIN_LEVEL } = require('./logger.js');
const { promises: fs } = require('fs');
const path = require('path');
const EventEmitter = require('node:events');

const environment = "development";

let providers = {};
let config;

class SharedController extends EventEmitter {
    constructor() {
        super();
        this.commands = new Map();
        this.environment = environment;
        this.exposed_functions = new Map();
        this.LEVEL = LEVEL;
    }
    dispatchMessage(msg) {
        this.emit('message', msg);
    }
    dispatchCommand(msg) {
        let args = msg.message.content.split(" ");
        let cmd = args.shift();
        if(config.providers[msg.source][environment].strip_prefix) cmd = cmd.substr(1);
        let handler = this.commands.get(cmd);
        if(handler) {
            log(`Found trigger for command ${cmd} (${handler.func.name}), dispatching.`, LEVEL.DEBUG);
            handler.func(cmd, args, msg);
        } else {
            log(`No handler found for command ${cmd}.`, LEVEL.DEBUG);
        }
    }
    registerCommand(trigger, func, description="(No description provided)", aliases=[]) {
        log(`Registered command ${func.name} for trigger ${trigger}`, LEVEL.DEBUG);
        this.commands.set(trigger, { func, description, alias: false });
        for(const alias of aliases) {
            log(`Registered alias of ${func.name} (${alias}).`, LEVEL.DEBUG);
            this.commands.set(alias, { func, description, alias: true, aliasOf: trigger });
        }
    }
    expose(name, func) {
        log(`Plugin registered exposed function ${func.name} as ${name}.`, LEVEL.DEBUG);
        this.exposed_functions.set(name, func);
    }
    get_exposed(name) {
        let func = this.exposed_functions.get(name);
        if(func === undefined) {
            log(`Plugin attempted to call unregistered exposed function ${name}!`, LEVEL.WARN);
            return false;
        } else {
            return func;
        }
    }
    log(msg, level) {
        log(msg, level);
    }
}

const ctrl = new SharedController();

async function loadConfig() {
    log(`Loading config`, LEVEL.DEBUG);
    try {
        config = JSON.parse(await fs.readFile("./config.json"));
        ctrl.config = config;
        log(`Config has been loaded!`, LEVEL.INFO);
    } catch (err) {
        log(`Unable to load config.json!`, LEVEL.FATAL);
        process.exit(1);
    }
}

async function loadProviders() {
    log(`Loading providers...`, LEVEL.INFO);
    const providers_list = Object.keys(config.providers);
    log(`Found the following providers in config.json: ${providers_list.join(', ')}.`, LEVEL.DEBUG);
    for (const provider of providers_list) {
        try {
            log(`Initializing provider ${provider}`, LEVEL.DEBUG);
            const entry = require("./" + path.join("./modules/providers/", `${provider}.js`));
            providers[provider] = entry(config.providers[provider][environment], ctrl);
        } catch (err) {
            log(`Failed to load provider ${provider}!\n\t${err}`, LEVEL.ERROR);
        }
    }
}

async function loadPlugins() {
    log(`Loading plugins...`, LEVEL.INFO)
    const plugins_list = await fs.readdir("./modules/plugins");
    log(`Found the following plugins: ${plugins_list.join(", ")}.`, LEVEL.DEBUG);
    for (let plugin of plugins_list) {
        try {
            plugin = plugin.split(".js")[0];
            log(`Initializing plugin ${plugin}`, LEVEL.DEBUG);
            const init = require("./" + path.join("./modules/plugins/", plugin+".js"));
            init(environment, ctrl, ctrl.config.plugin_specific[plugin]);
        } catch (err) {
            log(`Failed to load plugin ${plugin}!\n\t${err}`, LEVEL.ERROR);
        }
    }
}

async function triggerPostPlugin() {
    log(`Triggering post-plugin load handlers...`, LEVEL.DEBUG);
    for(const provider in providers) {
        if(providers[provider].postPluginInit) await providers[provider].postPluginInit();
    }
}

async function main() {
    log(`Cubic is starting up...`, LEVEL.INFO);
    await loadConfig();
    await loadProviders();
    await loadPlugins();
    await triggerPostPlugin();
}

main();
