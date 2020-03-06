const fs = require('fs');
const { join } = require("path");
const rimraf = require("rimraf");
const S3Service = require("./s3Service");
const CloudFormationUtils = require("../utils/cloudFormationUtils");
const { zip } = require('../utils/zipUtils');

module.exports = app => {

    const INITIATOR_FIELD_NUM = 5;
    const INITIATOR_HEADERS = ['initiator', 'left sequence', 'left spacer', 'right sequence', 'right spacer'];
    const UPLOAD_SPLITTER = "_";
    const FILE_KEY = "fastaFile";
    const PATH_KEY = "path";
    const BOWTIE_INDEX_KEY = "bowtieSelect";
    const DESIRED_SPACES_KEY = "numSpaces";
    const PROBE_LENGTH_KEY = "probeLength";
    const MIN_GC_KEY = "minGC";
    const MAX_GC_KEY = "maxGC";
    const MIN_TM_KEY = "minTm";
    const MAX_TM_KEY = "maxTm";
    const SALT_CONCENTRATION_KEY = "saltConcentration";
    const FORMAMIDE_KEY = "formamide";
    const EMAIL_KEY = "email";
    const TEMP_DIRECTORY_PATH = "tmp";
    const BOWTIE_INDEX_DIRECTORY = "bowtie_indexes";

    createInitiatorFile = (initiators, path) => {
        fs.writeFile(`${path}/initiators.csv`, INITIATOR_HEADERS.join(',') + '\n', {flag: 'w+'}, (err) => {
            if (err) throw err;
        });

        initiators.forEach((initiator, _) => {
            const line = initiator.join(',') + '\n';
            fs.appendFile(`${path}/initiators.csv`, line, {flag: 'a+'}, (err) => {
                if (err) throw err;
            });
        })
    }

    parseInitiators = (formData) => {
        const initiatorKeys = Object.keys(formData).filter(key => key.startsWith("initiator"));
        const initiatorFields = [];
        let i = 0;
        while (i < initiatorKeys.length) {
            try {
                const initiator = [];
                for (let j = 0; j < INITIATOR_FIELD_NUM; j++) {
                    initiator.push(formData[initiatorKeys[i+j]]);
                }
                initiatorFields.push(initiator);
                i = i + INITIATOR_FIELD_NUM;
            } catch (err) {
                throw Error("Malformed initiators.");
            }
        }
        return initiatorFields;
    }

    getJobId = (formData) => {
        return formData[FILE_KEY][PATH_KEY].split(UPLOAD_SPLITTER).slice(-1)[0];
    }

    createEnvFile = (formData, path) => {
        const fastaPath = `seq_path=target.fa`;
        const pathToBowtieIndex = `path_to_bowtie_index=${formData[BOWTIE_INDEX_KEY]}`;
        const bowtieIndexBasename = `bowtie_index_basename=${formData[BOWTIE_INDEX_KEY]}`;
        const initiatorPath = `initiator=initiators.csv`;
        const desiredSpaces = `desired_spaces=${parseInt(formData[DESIRED_SPACES_KEY]) + 1}`;
        const l = `l=${formData[PROBE_LENGTH_KEY]}`;
        const L = `L=${formData[PROBE_LENGTH_KEY]}`;
        const g = `g=${formData[MIN_GC_KEY]}`;
        const G = `G=${formData[MAX_GC_KEY]}`;
        const t = `t=${formData[MIN_TM_KEY]}`;
        const T = `T=${formData[MAX_TM_KEY]}`;
        const s = `s=${formData[SALT_CONCENTRATION_KEY]}`;
        const F = `F=${formData[FORMAMIDE_KEY]}`;
        const fetch = `fetch=true`;
        const aws_client_id = `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`;
        const aws_secret_key = `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`;
        const aws_default_region = `AWS_DEFAULT_REGION=${process.env.AWS_DEFAULT_REGION}`;
        const sendgrid_key = `SENDGRID_API_KEY=${process.env.SENDGRID_API_KEY}`;
        const email = `email=${formData[EMAIL_KEY]}`;
        const env_vars = [fastaPath, pathToBowtieIndex, bowtieIndexBasename, initiatorPath, 
                          desiredSpaces, l, L, g, G, t, T, s, F, fetch, 
                          aws_client_id, aws_secret_key, aws_default_region, sendgrid_key, email];

        fs.writeFile(`${path}/env_file`, env_vars.join('\n'), {flag: 'w+'}, (err) => {
            if (err) throw err;
        });
    }

    makeJobDirectory = (dirName) => {
        const path = `${TEMP_DIRECTORY_PATH}/${dirName}`;
        fs.mkdirSync(path, (err) => {
            if (err) throw err;
        });
        return path;
    }

    generateProbes = async (req, res) => {
        try {
            const stackNameRegex = /[a-zA-Z][-a-zA-Z0-9]*/;
            const job = getJobId(req.files);
            const jobId = job.match(stackNameRegex) !== job ? 'a' + job : job;

            const path = makeJobDirectory(jobId);

            fs.renameSync(req.files[FILE_KEY][PATH_KEY], `${TEMP_DIRECTORY_PATH}/${jobId}/target.fa`, (err) => {
                if (err) throw err;
            });

            const initiators = parseInitiators(req.fields);
            createInitiatorFile(initiators, path);

            createEnvFile(req.fields, path);

            await zip(jobId, `${TEMP_DIRECTORY_PATH}`);

            const s3 = new S3Service();
            await s3.uploadFile(`${TEMP_DIRECTORY_PATH}/${jobId}.zip`, "probegenerator-jobs", jobId);

            const cloudFormation = new CloudFormationUtils();
            const stackDetails = await cloudFormation.launchStack(jobId, req.fields[BOWTIE_INDEX_KEY]);
            console.log(stackDetails);

            cleanup(jobId);

            return res.sendStatus(200);
        } catch (err) {
            console.log(err);
            res.sendStatus(400);
            throw err;
        }
    }

    cleanup = (jobId) => {
        const path = `${TEMP_DIRECTORY_PATH}/${jobId}`;

        fs.unlink(path + '.zip', (err) => {
            if (err) {
              console.error(err)
              throw err;
            }
        });

        rimraf(path, (err) => { 
            if (err) {
                console.error(err)
                throw err;
            }
        });
    }

    getAvailableIndexes = (req, res) => {
        const path = `${BOWTIE_INDEX_DIRECTORY}`;
        const indexes = fs.readdirSync(path)
                          .filter(entry => fs.statSync(join(path, entry)).isDirectory());
        res.send(indexes);
    }
  
    app.post('/api/generateProbes', generateProbes);
    app.get('/api/bowtieIndexes', getAvailableIndexes);
};