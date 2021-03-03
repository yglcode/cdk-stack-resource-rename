import * as cdk from '@aws-cdk/core';

/**
 *
 */
export interface RenameProps {
  /**
  * An array of Resource Types that will not receive this tag
  *
  * An empty array will allow this tag to be applied to all resources. A
  * non-empty array will apply this tag only if the Resource type is not in
  * this array.
  * @default {}
  */
  readonly irregularResourceNames?: { [key: string]: string };

  /**
  * An array of Resource Types that will not receive this tag
  *
  * An empty array will allow this tag to be applied to all resources. A
  * non-empty array will apply this tag only if the Resource type is not in
  * this array.
  * @default []
  */
  readonly excludeResourceTypes?: string[];

  /**
  * An array of Resource Types that will not receive this tag
  *
  * An empty array will allow this tag to be applied to all resources. A
  * non-empty array will apply this tag only if the Resource type is not in
  * this array.
  * @default []
  */
  readonly includeResourceTypes?: string[];
}

/**
 *
 */
export class StackResourceRename implements cdk.IAspect {
  //some mapping for resources whose physical names donot follow
  //the regular naming conventions: `${resourceType}`+'Name'
  //such as bucketName, tableName, ...
  private irregularNames: { [key: string]: string } = {
    Stack: '_stackName',
    Output: '_exportName',
    ScalingPolicy: 'policyName',
    SlackChannelConfiguration: 'configurationName',
    CompositeAlarm: 'alarmName',
    SecurityGroup: 'groupName',
    DBProxy: 'dbProxyName',
  };
  private includeResTypes: string[] | undefined;
  private excludeResTypes: string[] | undefined;
  private defaultNameField = 'name';
  private postfix='';
  constructor(postfix: string, props: RenameProps = {}) {
    this.postfix=postfix;
    if (props.irregularResourceNames) {
      this.irregularNames = {
        ...this.irregularNames,
        ...props.irregularResourceNames,
      };
    }
    this.excludeResTypes = props.excludeResourceTypes;
    this.includeResTypes = props.includeResourceTypes;
  }

  visit(node: cdk.IConstruct): void {
    if (node instanceof cdk.Stack) {
      //rename stack
      this.rename(node, 'Stack');
    } else {
      //rename CFN resources
      let ctorName = node.constructor.name;
      //console.log("==", ctorName)
      if (ctorName.startsWith('Cfn')) {
        this.rename(node, ctorName.substring(3));
      }
    }
  }

  rename(node: cdk.IConstruct, resTypeName: string) {
    //check include/exclude
    if (this.excludeResTypes && this.excludeResTypes.length > 0 &&
      this.excludeResTypes.indexOf(resTypeName) !== -1) {
      return;
    }
    if (this.includeResTypes && this.includeResTypes.length > 0 &&
      this.includeResTypes.indexOf(resTypeName) === -1) {
      return;
    }
    //find the specific "name" field for CFN resources
    let physicalName = 'name';
    if (this.irregularNames[resTypeName]) {
      physicalName = this.irregularNames[resTypeName];
    } else {
      //decapitalize regular resource names
      let [first, ...rest] = resTypeName;
      let decapName = first.toLowerCase() + rest.join('');
      physicalName = `${decapName}Name`;
    }
    if (physicalName.length === 0) {
      return;
    }
    //some protected fields start with underscore
    let underscoreName = '_' + physicalName;
    //rename
    let b = (node as any);
    if (b[physicalName] && !cdk.Token.isUnresolved(b[physicalName])) {
      b[physicalName] = b[physicalName] + `-${this.postfix}`;
      //console.log("**** rename: ", b[physicalName]);
    } else if (b[underscoreName] && !cdk.Token.isUnresolved(b[underscoreName])) {
      b[underscoreName] = b[underscoreName] + `-${this.postfix}`;
      //console.log("**** rename: ", b[underscoreName]);
    } else if (b[this.defaultNameField] && !cdk.Token.isUnresolved(b[this.defaultNameField])) {
      b[this.defaultNameField] = b[this.defaultNameField] + `-${this.postfix}`;
      //console.log("**** rename: ", b[this.defaultNameField]);
    }
  }
}
