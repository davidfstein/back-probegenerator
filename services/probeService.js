const { exec } = require('child_process');

module.exports = app => {

    generateProbes = (req, res) => {
        // console.log(req.fields);
        // console.log(req.files);

        

        exec('sudo docker run --env-file=env_file -v $(pwd):/data dstein96/probegenerator:0.7.50', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                console.log(error.code);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });
        return res.sendStatus(200);
    }
  
    app.post('/api/generateProbes', generateProbes);
};