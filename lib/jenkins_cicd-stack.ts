import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface ServicesStackProps extends cdk.StackProps {
  stageName: string;
}

export class ServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServicesStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'AppDataBucket', {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const fn = new lambda.Function(this, 'DemoLambda', {
      functionName: `lambda_func_${props.stageName.toLowerCase()}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
def lambda_handler(event, context):
    return {
        "statusCode": 200,
        "body": "Hello from inline Lambda-5!"
    }
`),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        STAGE: props.stageName,
      },
    });


         const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    /** ---------------------------
     *  Single EC2 Instance
     *  --------------------------*/
   
const ec2Instance = new ec2.Instance(this, 'WebServer', {
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
  instanceType: new ec2.InstanceType('t3.micro'),
  machineImage: ec2.MachineImage.latestAmazonLinux2023(),
  blockDevices: [
    {
      deviceName: '/dev/xvda',
      volume: ec2.BlockDeviceVolume.ebs(8, {
        deleteOnTermination: true,
        encrypted: true,
      }),
    },
  ],
});

    // If later your Lambda needs S3 access, uncomment:
    // bucket.grantReadWrite(fn);
  }
}
