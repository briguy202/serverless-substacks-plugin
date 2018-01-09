const _ = require('lodash');
const path = require('path');

// Lifecycle cheat sheet: https://gist.github.com/HyperBrain/50d38027a8f57778d5b0f135d80ea406

class ExportFunctionsPlugin {
    constructor(serverless, options) {
        this.templates = [];
        this.serverless = serverless;
        this.provider = this.serverless.getProvider('aws');
        this.options = options;
        this.hooks = {
            'aws:deploy:deploy:uploadArtifacts': this.deployArtifacts.bind(this),
            'package:compileFunctions': this.packageArtifacts.bind(this),
        };
    }

    packageArtifacts() {
        return Promise.resolve().then(() => {
            if (!this.serverless.service.resources.Resources) {
                throw new this.serverless.classes.Error('This plugin needs access to Resources section of the AWS CloudFormation template');
            }

            const stackConfig = this.serverless.service.custom.stacks;
            if (!stackConfig) {
                throw new this.serverless.classes.Error(`To use the substacks plugin, specify the 'stacks' configuration property to define the substacks.`);
            }
            if (!_.isArray(stackConfig)) {
                throw new this.serverless.classes.Error(`The 'stacks' configuration property must be an array.`);
            }

            stackConfig.forEach(stack => {
                if (!stack.name) {
                    throw new this.serverless.classes.Error(`You must define a name for the substack.`);
                }
                this.log(`Processing substack '${stack.name}' ...`);

                let stackTemplate = {};
                this.serverless.service.getAllFunctions().forEach((functionName) => {
                    const functionObj = this.serverless.service.getFunction(functionName);
                    const normalizedFunctionName = this.provider.naming.getNormalizedFunctionName(functionName);
                    const functionLogicalId = this.provider.naming.getLambdaLogicalId(functionName);

                    _.merge(stackTemplate, JSON.parse(JSON.stringify(stack.template)
                        .replace(/{functionLogicalId}/gi, functionLogicalId)
                        .replace(/{functionName}/gi, functionName)
                        .replace(/{normalizedFunctionName}/gi, normalizedFunctionName)
                    ));
                });

                // Write the generated template to disk
                let template = {
                    template: stackTemplate,
                    file: `substack-${stack.name}.json`
                };
                template.filePath = path.join(this.serverless.config.servicePath, '.serverless', template.file);
                template.S3Path = `${this.serverless.service.package.artifactDirectoryName}/${template.file}`;
                template.S3Bucket = this.serverless.service.provider.deploymentBucket;

                this.serverless.utils.writeFileSync(template.filePath, template.template);
                this.templates.push(template);

                _.merge(this.serverless.service.resources.Resources, {
                    [`${stack.name}SubStack`]: {
                        Type: `AWS::CloudFormation::Stack`,
                        Properties: {
                            Parameters: {},
                            TemplateURL: `https://s3.amazonaws.com/${template.S3Bucket}/${template.S3Path}`
                        }
                    }
                });
            });
        });
    }

    deployArtifacts() {
        let p = [];
        if (this.templates.length > 0) {
            this.templates.forEach(template => {
                p.push(this.performUpload(template));
            })
        }
        return Promise.all(p);
    }

    log(message) {
        this.serverless.cli.log(`[serverless-substacks-plugin]: ${message}`);
    }

    performUpload(template) {
        const params = {
            Bucket: template.S3Bucket,
            Key: template.S3Path,
            Body: JSON.stringify(template.template),
            ContentType: 'application/json',
        };

        this.log(`Uploading substack CloudFormation file to S3 bucket ${params.Bucket} at path ${params.Key} ...`);

        return this.provider.request('S3',
            'putObject',
            params,
            this.options.stage,
            this.options.region);
    }
}

module.exports = ExportFunctionsPlugin;