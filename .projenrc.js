const { AwsCdkConstructLibrary } = require('projen');

const project = new AwsCdkConstructLibrary({
  author: 'Yigong Liu',
  authorAddress: 'ygl.code@gmail.com',
  cdkVersion: '1.91.0',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkConstructLibrary',
  name: 'cdk-stack-resource-rename',
  repositoryUrl: 'https://github.com/yglcode/cdk-stack-resource-rename.git',

  deps: [
    '@aws-cdk/core',
  ],

  devDeps: [
    '@aws-cdk/core',
    '@aws-cdk/aws-apigateway',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-s3',
  ],

  peerDeps: [
    '@aws-cdk/core',
  ],

  releaseBranches: ['main'],

  publishToMaven: {
    javaPackage: 'io.github.yglcode.cdkutils.aspects.resourcerename',
    mavenGroupId: 'io.github.yglcode.cdkutils.aspects.resourcerename',
    mavenArtifactId: 'cdk-stack-resource-rename',
    mavenRepositoryUrl: 'https://s01.oss.sonatype.org',
  },

  publishToPypi: {
    distName: 'cdk-stack-resource-rename',
    module: 'cdk_stack_resource_rename',
  },

  publishToNuget: {
    dotNetNamespace: 'CdkUtils.Aspects.ResourceRename',
    packageId: 'CdkUtils.Aspects.ResourceRename',
  },
});

const common_exclude = [
  'cdk.out', 'cdk.context.json', 'images', 'yarn-error.log',
];
project.npmignore.exclude(...common_exclude, 'maven_release*');
project.gitignore.exclude(...common_exclude);

project.synth();
