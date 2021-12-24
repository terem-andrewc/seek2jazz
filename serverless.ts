import type { AWS } from "@serverless/typescript";

// @ts-ignore
import hello from "@functions/hello";

const serverlessConfiguration: AWS = {
  useDotenv: true,
  service: "seek2jazz",
  frameworkVersion: "2",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    region: "ap-southeast-2",
    stage: "production",
    runtime: "nodejs14.x",
    timeout: 900,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    lambdaHashingVersion: "20201221",
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject"],
            Resource: ["arn:aws:s3:::seek2jazz-bucket/*"],
          },
        ],
      },
    },
  },

  // import the function via paths
  functions: { hello },
  resources: {
    Resources: {
      seek2jazz: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "seek2jazz-bucket",
        },
      },
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
