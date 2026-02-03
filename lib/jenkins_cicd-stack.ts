import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';



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
        "body": "Hello from inline Lambda!"
    }
`),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        STAGE: props.stageName,
      },
    });

    // If later your Lambda needs S3 access, uncomment:
    // bucket.grantReadWrite(fn);
  }
}
