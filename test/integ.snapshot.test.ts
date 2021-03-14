import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import { StackResourceRenamer } from '../src/index';
import { IntegTesting } from './integ.default';

test('integ snapshot validation', () => {
  const integ = new IntegTesting();
  let alias='xxx';
  StackResourceRenamer.rename(integ.stack[0], {
    rename: (origName, _)=>{
      return origName+'-'+alias;
    },
  });
  integ.stack.forEach(stack => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
  });
});
