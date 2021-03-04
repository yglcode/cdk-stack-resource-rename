## StackResourceRenamer
#### A CDK aspect, renames CDK stack name and stack's subordinate resources' custom physical names, so that a CDK stack can be used to create multiple stacks in same AWS environment without confliction.


### Sample


```ts
    const app = new core.App();

    const stack = new core.Stack(app, 'my-stack');

    let alias = stack.node.tryGetContext('alias');
    if (alias!==undefined) {
        //if alias is defined, rename stack and resources' custom names
        //with the "rename" function/method.
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

To create multiple stacks:

`cdk -c alias=a1 deploy  `
will create a stack: my-stack-a1 with my-bucket-a1.

To create more stacks: my-stack-a2 with my-bucket-a2, my-stack-a3 with my-bucket-a3:

`cdk -c alias=a2 deploy`

`cdk -c alias=a3 deploy`
