import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as core from '@aws-cdk/core';
import { StackResourceRenamer } from './index';

export class IntegTesting {
  readonly stack: core.Stack[]
  constructor() {
    const app = new core.App();

    const env = {
      region: process.env.CDK_DEFAULT_REGION,
      account: process.env.CDK_DEFAULT_ACCOUNT,
    };

    const stack = new core.Stack(app, 'integration-stack', { env });

    let alias = stack.node.tryGetContext('alias');
    if (alias===undefined) {
      alias='xxx';
    }
    StackResourceRenamer.rename(stack, {
      rename: (origName, _)=>{
        return origName+'-'+alias;
      },
    });

    //for integration test
    this.stack = [stack];

    //resources in stack
    const bucket = new s3.Bucket(stack, 'WidgetStore', {
      bucketName: 'widget-store-bucket',
    });

    const handler = new lambda.Function(stack, 'WidgetHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      functionName: 'handler_func',
      code: lambda.Code.fromInline(`
                exports.handler = async (event)=> {
                    console.log('event: ',event,' env: ',process.env);
                }
            `),
      environment: {
        BUCKET: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(handler);

    const api = new apigateway.RestApi(stack, 'widgets-api', {
      restApiName: 'Widget Service',
      description: 'serves widgets',
    });

    const getBind = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { 'application/json': '{"statusCode": "200"}' },
    });

    api.root.addMethod('GET', getBind, {
      operationName: 'get-widget',
    });

    new core.CfnOutput(stack, 'Dns', {
      exportName: 'ApiDns',
      value: api.url,
    });
  }
}

new IntegTesting();
