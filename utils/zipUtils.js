const child_process = require("child_process");

const zip = (jobId, path) => {
    child_process.execSync(`zip -r ${jobId}.zip ${jobId}`, {
        cwd: path
    });
}

module.exports = {
    zip
}