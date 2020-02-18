const AWS = require('aws-sdk');
const Constants = require('./Constants');

class EC2Utils {

    constructor() {
        this.ec2 = new AWS.EC2({apiVersion: '2016-11-15', region:'us-east-1'});
    }
    
    launchInstance() {
        const instanceParams = {
            MaxCount: 1, 
            MinCount: 1,
            LaunchTemplate: {
                LaunchTemplateId: Constants.LAUNCH_TEMPLATE_ID,
                Version: Constants.LAUNCH_TEMPLATE_VERSION
            },
        };
        return this.ec2.runInstances(instanceParams).promise();
    }
    
}

module.exports = EC2Utils;