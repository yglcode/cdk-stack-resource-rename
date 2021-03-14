import '@aws-cdk/assert/jest';
import { Stack } from '@aws-cdk/core';
import { StackResourceRenamer } from '../src/index';
import { IntegTesting } from './integ.default';

describe('TestCustomNamesRename', ()=> {
  let stack: Stack;

  beforeEach(()=>{
    let integ = new IntegTesting();
    stack=integ.stack[0];
    let alias='xxx';
    StackResourceRenamer.rename(stack, {
      rename: (origName, _)=>{
        return origName+'-'+alias;
      },
    });
  });

  test('test bucket name rename', () => {
    expect(stack).toHaveResource('AWS::S3::Bucket', {
      BucketName: 'widget-store-bucket-xxx',
    });
  });

  test('test lambda function name rename', () => {
    expect(stack).toHaveResource('AWS::Lambda::Function', {
      FunctionName: 'handler_func-xxx',
    });
  });

  test('test api stage name rename', () => {
    expect(stack).toHaveResource('AWS::ApiGateway::Stage', {
      StageName: 'prod-xxx',
    });
  });

  test('test api name rename', () => {
    expect(stack).toHaveResource('AWS::ApiGateway::RestApi', {
      Name: 'Widget Service-xxx',
    });
  });

  test('test export name rename', () => {
    expect(stack).toHaveOutput({
      exportName: 'ApiDns-xxx',
    });
  });
});
