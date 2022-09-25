import * as cdk from 'aws-cdk-lib';

export class TsRestStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new cdk.aws_s3.Bucket(this, 'DocusaurusBucket', {
      bucketName: 'docusaurus-website',
      websiteIndexDocument: 'index.html',
      blockPublicAccess: new cdk.aws_s3.BlockPublicAccess({
        restrictPublicBuckets: false,
      }),
    });

    const bucketPolicy = new cdk.aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${bucket.bucketArn}/*`],
      principals: [new cdk.aws_iam.AnyPrincipal()],
    });

    bucket.addToResourcePolicy(bucketPolicy); // 4
  }
}
