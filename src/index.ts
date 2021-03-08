import * as cdk from '@aws-cdk/core';

/**
 * Interface of operation used to rename stack and its resources
 */
export interface IRenameOperation {
  /**
   * Rename method to rename stack and its resources' physical names.
   * AWS generated physical names are not changed unless StackResourceRenamer
   * is created with RenameProps{ userCustomNameOnly:false }.
   * The updated stack name or resource's name is returned.
   * @param resourceName The original resource physical name (will be empty '' for AWS generated names).
   * @param resourceType The type name of CFN resource.
   */
  rename(resourceName: string, resourceType: string): string;
}

/**
 * Properties to control rename process.
 */
export interface RenameProps {
  /**
  * Only rename user provided custom names.
  * If set to false, rename() will be invoked for all resources names with or without custom names.
  *
  * @default True
  */
  readonly userCustomNameOnly?: boolean;
  /**
  * Mapping of resourceType names to physicalName fields
  * for resources whose physicalName field donot follow
  * the regular naming conventions: `${resourceType}`+'Name'
  *
  * @default {}
  */
  readonly irregularResourceNames?: { [key: string]: string };

  /**
  * An array of Resource Types whose physical names could not be changed.
  *
  * An empty array will allow the renaming for all resources. A non-empty
  * array will apply rename operation only if the Resource type is not in
  * this array.
  * @default []
  */
  readonly excludeResourceTypes?: string[];

  /**
  * An array of Resource Types whose physical names could be updated.
  *
  * An empty array will not allow any renaming to resources. A
  * non-empty array will allow renaming only if the Resource type is in
  * this array.
  * @default []
  */
  readonly includeResourceTypes?: string[];
}

/**
 * StackResourceRenamer renames stack name and stack's subordinate resources'
 * physical names, so that a CDK stack can be used to create multiple
 * stacks in same AWS environment.
 */
export class StackResourceRenamer implements cdk.IAspect {
  /**
   * Static method to rename a stack and all its subordinate resources.
   * @param stack The stack (and all its children resources) to be renamed.
   * @param renameOper RenameOperation is used to rename
   * stack name and resources' physical names. AWS generated
   * physical names are not changed unless the "props" is set with
   * RenameProps{userCustomNameOnly:false}
   * @param props Properties are set to customize rename operations.
   */
  static rename(stack: cdk.IConstruct, renameOper: IRenameOperation, props: RenameProps = {}) {
    cdk.Aspects.of(stack).add(new StackResourceRenamer(renameOper, props));
  }

  //mapping for resources whose physical names donot follow
  //the regular naming conventions: `${resourceType}`+'Name'
  private irregularNames: { [key: string]: string } = {
    Output: 'exportName',
    ScalingPolicy: 'policyName',
    SlackChannelConfiguration: 'configurationName',
    CompositeAlarm: 'alarmName',
    SecurityGroup: 'groupName',
    DBProxy: 'dbProxyName',
  };
  private includeResTypes: string[] | undefined;
  private excludeResTypes: string[] | undefined;
  //by default, only rename user provdied custom names
  private customNameOnly = true;
  private defaultNameField = 'name';
  /**
   * Construct a new StackResourceRenamer.
   * @param renameOper RenameOperation is used to rename
   * stack name and resources' physical names. AWS generated
   * physical names are not changed unless the "props" is set with
   * RenameProps{userCustomNameOnly:false}
   * @param props Properties are set to customize rename operations.
   */
  constructor(private renameOper: IRenameOperation, props: RenameProps = {}) {
    if (props.irregularResourceNames) {
      this.irregularNames = {
        ...this.irregularNames,
        ...props.irregularResourceNames,
      };
    }
    this.excludeResTypes = props.excludeResourceTypes;
    this.includeResTypes = props.includeResourceTypes;
    if (props.userCustomNameOnly!==undefined) {
      this.customNameOnly = props.userCustomNameOnly;
    }
  }
  /**
   * Implement core.IAspect interface
   * @param node CFN resources to be renamed.
   */
  visit(node: cdk.IConstruct): void {
    if (node instanceof cdk.Stack) {
      //rename stack
      this.renameResource(node, 'Stack');
    } else {
      //rename CFN resources
      let ctorName = node.constructor.name;
      if (ctorName.startsWith('Cfn')) {
        this.renameResource(node, ctorName.substring(3));
      }
    }
  }
  /**
   * Rename a CFN resource or stack.
   * @param node CFN resource or stack.
   * @param resTypeName The type name of CFN resource.
   */
  protected renameResource(node: cdk.IConstruct, resTypeName: string) {
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
    //some names (eg. stackName, exportName) only has getter,
    //need access protected fields starting with underscore
    let underscoreName = '_' + physicalName;
    //rename
    let b = (node as any);
    if (b[physicalName] && b[physicalName].length > 0) {
      let resName = this.isTarget(b[physicalName]);
      if (isWritable(b, physicalName) && resName.ok) {
        b[physicalName] = this.renameOper.rename(resName.value, resTypeName);
      } else if (b[underscoreName] && b[underscoreName].length > 0 && isWritable(b, underscoreName)) {
        resName = this.isTarget(b[underscoreName]);
        if (resName.ok) {
          b[underscoreName] = this.renameOper.rename(resName.value, resTypeName);
        }
      }
    } else if (b[this.defaultNameField] && b[this.defaultNameField].length > 0 && isWritable(b, this.defaultNameField)) {
      let resName = this.isTarget(b[this.defaultNameField]);
      if (resName.ok) {
        b[this.defaultNameField] = this.renameOper.rename(resName.value, resTypeName);
      }
    }
  }
  /**
   * check if a resName(resource name) is a valid target for rename;
   * if valid, return correct resName and ok:true, otherwise return ok:false
   */
  isTarget(resName: any): {value: string; ok:boolean} {
    let isAWSGenerated = cdk.Token.isUnresolved(resName);
    if (this.customNameOnly && isAWSGenerated) {
      return { value: '', ok: false };
    }
    if (!this.customNameOnly && isAWSGenerated) {
      return { value: '', ok: true }; //return empty for aws generated names
    }
    return { value: resName, ok: true };
  }
}

function isWritable<T extends Object>(obj: T, key: keyof T): boolean {
  let desc: PropertyDescriptor|undefined;
  for (let o = obj; o != Object.prototype; o = Object.getPrototypeOf(o)) {
    desc = Object.getOwnPropertyDescriptor(o, key);
    if (desc !== undefined) {
      break;
    }
  }
  if (desc===undefined) {
    desc={};
  }
  return Boolean(desc.writable);
}
