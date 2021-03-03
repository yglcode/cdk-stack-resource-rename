const { AwsCdkConstructLibrary } = require('projen');

const project = new AwsCdkConstructLibrary({
  author: 'Yigong Liu',
  authorAddress: 'ygl.code@gmail.com',
  cdkVersion: '1.88.0',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkConstructLibrary',
  name: 'cdk-stack-resource-rename',
  repositoryUrl: 'https://github.com/yglcode/cdk-stack-resource-rename.git',

  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-apigateway',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-s3',
  ],

  releaseBranches: ['main'],

  
});

const common_exclude = [
  'cdk.out', 'cdk.context.json', 'images', 'yarn-error.log',
];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
