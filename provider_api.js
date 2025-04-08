const { log, LEVEL, MIN_LEVEL } = require('./logger.js');

class Provider {
    constructor(platform_name, config) {
        if(!platform_name || !config) {
            log(`A Provider was instantiated with missing arguments.`, LEVEL.ERROR);
            throw "MISSING_ARGUMENTS";
        }
        this.platform_name = platform_name;
        this.config = config;
    }
}

exports.Provider = Provider;