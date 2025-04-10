// CubicLogger by fwfy
// originally written for radio-thing

const colors = require('yoctocolors-cjs');

let MIN_LEVEL = 0;

const LOG_LEVEL = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
}

const LOG_COLORS = {
    DEFAULT: colors.reset,
    INFO: colors.green,
    WARN: colors.yellow,
    ERROR: colors.redBright,
    FATAL: colors.red
}

function log(msg, level) {
    if(level < MIN_LEVEL) return;
    if(typeof level == "undefined") {
        level = LOG_LEVEL.INFO;
        let blame = new Error().stack.split("\n")[2].trim();
        msg += `\n\t${colors.bgCyanBright("^ NO LOG LEVEL SPECIFIED!!")} ${blame}`;
    }
    let lvl_name = Object.keys(LOG_LEVEL)[level];
    let color = LOG_COLORS[lvl_name] || LOG_COLORS["DEFAULT"];
    console.log(`${color("["+lvl_name+"]")}\t${msg}`);
}

exports.log = log;
exports.LEVEL = LOG_LEVEL;
exports.MIN_LEVEL = MIN_LEVEL;