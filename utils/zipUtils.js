const file_system = require('fs');
const archiver = require('archiver');

const zip = (jobId, path) => {
    const output = file_system.createWriteStream(`${path}/${jobId}.zip`);
    const archive = archiver('zip');

    return new Promise((resolve, reject) => {
        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
        });

        archive.on('error', function(err){
            throw err;
        });

        archive.pipe(output);
        archive.directory(`${path}/${jobId}`, false);
        output.on('close', () => resolve());
        archive.finalize();
    });
}

module.exports = {
    zip
}