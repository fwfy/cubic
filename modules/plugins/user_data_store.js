let ctrl, db, environment;

const fs = require('fs');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
let key;

function encryptData(data, key) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
}

function decryptData(buffer, key) {
    const iv = buffer.slice(0, IV_LENGTH);
    const tag = buffer.slice(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = buffer.slice(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
}

function save_db() {
    let data = encryptData(db, key);
    fs.writeFileSync("user_data.enc", data);
}

function load_db() {
    try {
        db = decryptData(fs.readFileSync("user_data.enc"), key);
    } catch(err) {
        ctrl.log(`Unable to load user_data.enc!! Resetting. If the file already exists, a backup will be saved.\n\t${err}`, ctrl.LEVEL.ERROR);
        let exists = fs.existsSync("user_data.enc");
        if(exists) {
            try {
                fs.copyFileSync("user_data.enc", `user_data_backup_${Date.now()}.enc`);
            } catch(err) {
                ctrl.log(`Unable to create backup of user data file. Something very bad has probably happened. Goodbye!\n\t${err}`, ctrl.LEVEL.FATAL);
                process.exit(1);
            }
            fs.unlinkSync("user_data.enc");
        }
        db = {};
        save_db();
        ctrl.log(`Continuing with freshly initialized database, user settings have been reset.`, ctrl.LEVEL.WARN);
    }
}

function commandSetEncryption(cmd, args, msg) {
    // TODO: Implement
    let profile = db[ctrl.environment][msg.source][msg.author.id];
    if(args.length == 0) {
        return msg.reply(`This command lets you manage encryption for your account.\n\nIf enabled, your profile will automatically enter "amnesiac mode" one hour after your last command. In this mode, your preferences and personal data will not be remembered or stored, and you'll appear anonymous to the bot until you unlock your profile again.\n\nTo access personalization features, you’ll need to use the "unlock" command with your PIN.\n\nNote: All user data is already encrypted at rest and decrypted only at runtime. This setting adds an extra layer of privacy.\n\n⚠️ If you enable this and forget your PIN, there is no way to recover your data — not even the bot's developer or host can help.`);
    }
}

/*
    {
        "environments": {
            "development": {
                "providers": {
                    "telegram": {
                        users: {
                            "289041294012": {
                                prefs: { ... },
                                data: { ... },
                                isLinked: bool,
                                linked_to: String | null
                            }
                        }
                    }
                }
            }
        }
    }
*/

function validatePath(environment, provider, uid) {
    if(!db.environments) {
        db.environments = {};
    }
    if(!db.environments[environment]) {
        db.environments[environment] = {};
    }
    if(!db.environments[environment].providers) {
        db.environments[environment].providers = {};
    }
    if(!db.environments[environment].providers[provider]) {
        db.environments[environment].providers[provider] = {};
    }
    if(!db.environments[environment].providers[provider].users) {
        db.environments[environment].providers[provider].users = {};
    }
    if(!db.environments[environment].providers[provider].users[uid]) {
        db.environments[environment].providers[provider].users[uid] = {
            prefs: {},
            data: {},
            isLinked: false,
            linked_to: null
        }
    }
    console.log(`Validated path ${environment} ${provider} ${uid}:`, db.environments[environment].providers[provider].users[uid]);
}

function getUserPreference(provider, uid, prefname) {
    validatePath(environment, provider, uid);
    return db.environments[environment].providers[provider].users[uid].prefs[prefname];
}

function setUserPreference(provider, uid, prefname, value) {
    validatePath(environment, provider, uid);
    return db.environments[environment].providers[provider].users[uid].prefs[prefname] = value;
}

function init(env, cobj, pconf) {
    ctrl = cobj;
    environment = env;
    key = Buffer.from(pconf.encryption_key, 'hex');
    ctrl.expose("udata.get_pref", getUserPreference);
    ctrl.expose("udata.set_pref", setUserPreference);
    load_db();
    setInterval(save_db, 30000);
}

module.exports = init;