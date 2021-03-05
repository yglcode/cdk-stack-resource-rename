[![NPM version](https://badge.fury.io/js/cdk-stack-resource-rename.svg)](https://badge.fury.io/js/cdk-stack-resource-rename)
[![PyPI version](https://badge.fury.io/py/cdk-stack-resource-rename.svg)](https://badge.fury.io/py/cdk-stack-resource-rename)
[![Nuget version](https://badge.fury.io/nu/cdk-stack-resource-rename.svg)](https://badge.fury.io/nu/CdkUtils.Aspects.ResourceRename)
![Release](https://github.com/yglcode/cdk-stack-resource-rename/workflows/Release/badge.svg)


## StackResourceRenamer

#### A CDK aspect, StackResourceRenamer renames CDK stack name and stack's subordinate resources' custom physical names, so that a CDK stack can be used to create multiple stacks in same AWS environment without confliction.

### API: [API.md](https://github.com/yglcode/cdk-stack-resource-rename/blob/main/API.md)

### Samples

*typescript*
```ts
import { StackResourceRenamer } from 'cdk-stack-resource-rename';

const app = new core.App();
const stack = new core.Stack(app, 'my-stack');

let alias = stack.node.tryGetContext('alias');
if (alias) {
    //if alias is defined, rename stack and resources' custom names
    StackResourceRenamer.rename(stack, {
        rename: (origName, _)=>{
            return origName+'-'+alias;
        },
    });
}

//resources in stack
const bucket = new s3.Bucket(stack, 'bucket', {
    bucketName: 'my-bucket',
});
... 
```
*python*
```python
from cdk_stack_resource_rename import (StackResourceRenamer, IRenameOperation)

@jsii.implements(IRenameOperation)
class RenameOper:
    def __init__(self, alias):
        self.alias=alias
    def rename(self, origName, typeName):
        return origName+'-'+self.alias

class AppStack(core.Stack):
    def __init__(self, scope: core.Construct, construct_id: str, **kwargs) -> None:
        ......
        alias = self.node.try_get_context("alias")
        if alias != None:
            # if alias is defined, rename stack/resources' custom names
            StackResourceRenamer.rename(self, RenameOper(alias))
```
*java*
```java
import cdkutils.aspects.resourcerename.StackResourceRenamer;
import cdkutils.aspects.resourcerename.IRenameOperation;

public class AppStack extends Stack {
    ......
    String alias = (String) this.getNode().tryGetContext("alias");
    if (alias != null) {
        StackResourceRenamer.rename(this, new IRenameOperation() {
            public String rename(String origName, String typeName) {
                return origName + "-"+alias;
            }
        });
    }
```

To create multiple stacks:

`cdk -c alias=a1 deploy  `
will create a stack: my-stack-a1 with my-bucket-a1.

To create more stacks: my-stack-a2 with my-bucket-a2, my-stack-a3 with my-bucket-a3:

`cdk -c alias=a2 deploy`

`cdk -c alias=a3 deploy`
