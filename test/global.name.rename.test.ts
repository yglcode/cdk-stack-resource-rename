import '@aws-cdk/assert/jest';
import { Stack } from '@aws-cdk/core';
import { StackResourceRenamer } from '../src/index';
import { IntegTesting } from './integ.default';

describe('TestCustomNamesRename', ()=> {
  let stack: Stack;

  beforeEach(()=>{
    let integ = new IntegTesting();
    stack=integ.stack[0];
    let counts: { [key: string]: number } = {};
    StackResourceRenamer.rename(stack, {
      rename: (_, typeName)=>{
        if (counts[typeName]===undefined) {
          counts[typeName]=0;
        }
        counts[typeName]++;
        return 'projN-serviceN-'+typeName+'-'+counts[typeName];
      },
    }, { userCustomNameOnly: false } );
  });

  test('test bucket name rename', () => {
    expect(stack).toHaveResource('AWS::S3::Bucket', {
      BucketName: 'projN-serviceN-Bucket-1',
    });
  });

  test('test lambda function name rename', () => {
    expect(stack).toHaveResource('AWS::Lambda::Function', {
      FunctionName: 'projN-serviceN-Function-1',
    });
  });

  test('test api stage name rename', () => {
    expect(stack).toHaveResource('AWS::ApiGateway::Stage', {
      StageName: 'projN-serviceN-Stage-1',
    });
  });

  test('test api name rename', () => {
    expect(stack).toHaveResource('AWS::ApiGateway::RestApi', {
      Name: 'projN-serviceN-RestApi-1',
    });
  });

});
