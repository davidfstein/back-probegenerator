const fs = require('fs');
const AWS = require('aws-sdk');

const ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_SECRET_ACCESS_KEY;

class S3Service {

    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: ID,
            secretAccessKey: SECRET
        });
    }

    uploadFile(fileName, bucket, key) {
        // Read content from the file
        const fileContent = fs.readFileSync(fileName);
    
        // Setting up S3 upload parameters
        const params = {
            Bucket: bucket,
            Key: key, 
            Body: fileContent
        };
    
        // Uploading files to the bucket
        return this.s3.upload(params, (err, data) => {
            if (err) throw err;
            console.log(`File uploaded successfully. ${data.Location}`);
        }).promise();
    };
}

module.exports = S3Service;