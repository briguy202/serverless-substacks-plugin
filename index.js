var lo = require('lodash');

class ExportFunctionsPlugin {
    constructor(serverless) {
        this.serverless = serverless;
        this.provider = 'aws';
        this.hooks = {
            'package:initialize': this.execute.bind(this),
        };
    }

    execute() {
        if (!this.serverless.service.resources.Resources) {
            throw new this.serverless.classes.Error('This plugin needs access to Resources section of the AWS CloudFormation template');
        }

        this.serverless.service.getAllFunctions().forEach((functionName) => {
            const functionObj = this.serverless.service.getFunction(functionName);
            console.log(functionObj);
            // console.log(this.serverless.service.resources.Resources);
            // console.log(functionName);

            lodash.merge(this.serverless.service.resources.Resources, {
                Output: {
                    foo: 'bar'
                }
            });
            throw new this.serverless.classes.Error('stopping');

            // if (functionObj.events) {
            //     for (let i = 0; i < functionObj.events.length; i++) {
            //         const event = functionObj.events[i];
            //         if (event === 'alexaSkillsKit' || event.alexaSmartHome) {
            //             const permissionTemplate = {
            //                 Type: 'AWS::Lambda::Permission',
            //                 Properties: {
            //                     FunctionName: {'Fn::GetAtt': [functionName, 'Arn']},
            //                     Action: 'lambda:InvokeFunction',
            //                 },
            //             };
            //
            //             if (event === 'alexaSkillsKit') {
            //                 permissionTemplate.Properties.Principal = 'alexa-appkit.amazon.com';
            //             } else {
            //                 if (typeof event.alexaSmartHome !== 'string') {
            //                     const errorMessage = [
            //                         `Alexa Smart Home event of function ${functionName} is not a string`,
            //                         ' The correct syntax requires your skill\'s application ID from the',
            //                         ' Alexa Developer Console, example:',
            //                         ' alexaSmartHome: amzn1.ask.skill.12345678-1234-4234-8234-9234567890AB',
            //                         ' Please check the docs for more info.',
            //                     ].join('');
            //                     throw new this.serverless.classes
            //                         .Error(errorMessage);
            //                 }
            //                 permissionTemplate.Properties.Principal = 'alexa-connectedhome.amazon.com';
            //                 permissionTemplate.Properties.EventSourceToken = event.alexaSmartHome;
            //             }
            //
            //             const newPermissionObject = {
            //                 [`${functionName}AlexaEventPermission${i}`]: permissionTemplate,
            //             };
            //

            //         }
            //     }
            // }
        });
    }
}

module.exports = ExportFunctionsPlugin;