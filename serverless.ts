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
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    lambdaHashingVersion: "20201221",
    // iam: {
    //   role: {
    //     statements: [
    //       {
    //         Effect: "Allow",
    //         Action: ["ssm:GetParametersByPath"],
    //         Resource: ["*"],
    //       },
    //     ],
    //   },
    // },
  },
  // import the function via paths
  functions: { hello },
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
