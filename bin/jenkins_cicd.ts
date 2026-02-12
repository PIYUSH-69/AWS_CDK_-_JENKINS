#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServicesStack } from '../lib/jenkins_cicd-stack';

const app = new cdk.App();

const account = '706877673330';
const region = process.env.CDK_DEFAULT_REGION || 'ap-south-1';

new ServicesStack(app, 'ServicesStack-Test', {
  stageName: 'Test',
  env: { account, region },
});

new ServicesStack(app, 'ServicesStack-Prod', {
  stageName: 'Prod',
  env: { account, region },
});