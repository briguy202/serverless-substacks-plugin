const _ = require('lodash');

class ExportFunctionsPlugin {
    constructor(serverless) {
        this.serverless = serverless;
        this.provider = this.serverless.getProvider('aws');
        this.hooks = {
            'deploy:compileEvents': this.execute.bind(this),
        };
    }

    execute() {
        if (!this.serverless.service.resources.Outputs) {
            throw new this.serverless.classes.Error('This plugin needs access to Outputs section of the AWS CloudFormation template');
        }

        this.serverless.service.getAllFunctions().forEach((functionName) => {
            const functionObj = this.serverless.service.getFunction(functionName);
            const normalizedFunctionName = this.provider.naming.getNormalizedFunctionName(functionName);
            const functionLogicalId = this.provider.naming.getLambdaLogicalId(functionName);
            const configs = Object.assign({}, {namePattern: '{functionLogicalId}'}, this.serverless.service.custom.export);

            _.merge(this.serverless.service.resources.Outputs, {
                [`${functionLogicalId}Export`]: {
                    Description: `The ARN reference for the ${functionName} function.`,
                    Value: {
                        Ref: functionLogicalId
                    },
                    Export: {
                        Name: configs.namePattern.replace('{functionLogicalId}', functionLogicalId)
                    }
                }
            });
        });
    }
}

module.exports = ExportFunctionsPlugin;