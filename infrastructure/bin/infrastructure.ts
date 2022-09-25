#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TsRestStack } from '../lib/hello-cdk-stack';

const app = new cdk.App();

new TsRestStack(app, 'HelloCdkStack');
