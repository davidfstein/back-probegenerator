const AWS = require('aws-sdk');
const Constants = require('./Constants');

class CloudFormationUtils {

    constructor() {
        this.cloudFormation = new AWS.CloudFormation({apiVersion: '2016-11-15', region:'us-east-1'});
    }
    
    launchStack(stackName, indexKey) {
        const params = { 
            StackName: stackName,
            Parameters: [
                {
                    ParameterKey: 'JobS3KeyParam',
                    ParameterValue: stackName,
                },
                {
                    ParameterKey: 'BowtieIndex',
                    ParameterValue: indexKey
                },
                {
                    ParameterKey: 'AWSACCESSKEYID',
                    ParameterValue: process.env.AWS_ACCESS_KEY_ID,  
                },
                {
                    ParameterKey: 'AWSSECRETACCESSKEY',
                    ParameterValue: process.env.AWS_SECRET_ACCESS_KEY,  
                },
                {
                    ParameterKey: 'AWSDEFAULTREGION',
                    ParameterValue: process.env.AWS_DEFAULT_REGION,  
                }
            ],
            TemplateURL: Constants.PROBE_STACK_URL
        }
        return this.cloudFormation.createStack(params).promise();
    }
    
}

module.exports = CloudFormationUtils;