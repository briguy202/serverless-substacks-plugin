# Serverless Exports Plugin

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

A [serverless](http://www.serverless.com) plugin to create Cloudformation Outputs and Exports for each function in a deployment.

## Installation

```
npm install serverless-export-functions-plugin --save-dev
```

## Setup

Add the plugin to your `serverless.yml` file:
```yaml
# serverless.yaml
plugins:
  - serverless-export-functions-plugin
```

## Configuration

No configuration is required.  By default, simply adding the plugin will produce outputs for each function, but this can be customized using the following options.

**namePattern** - a value to override the exported name.  By default, this value is set to `{functionLogicalId}`.  The value can contain the following tokens inside of brackets `{}` which will be replaced for each function:

* `functionLogicalId`: the value Serverless generates for a function's logical ID.

```yaml
# serverless.yaml
custom:
    export:
        namePattern: somevalue-{functionLogicalId}
```