pipeline {
  agent any

  environment {
    AWS_REGION = "ap-south-1"
    AWS_DEFAULT_REGION = "ap-south-1"
    CDK_DEFAULT_REGION = "ap-south-1"
    CDK_DEFAULT_ACCOUNT = "706877673330"
  }

  tools {
    nodejs "node18"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install') {
      steps {
        sh '''
          node -v
          npm -v
          npm ci
        '''
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('CDK Synth') {
      steps {
        sh '''
          npx cdk --version
          npx cdk synth
        '''
      }
    }

    stage('Deploy Test (test branch)') {
      when { branch 'test' }
      steps {
        withAWS(credentials: 'aws-creds', region: "${env.AWS_REGION}") {
          sh '''
            # Run bootstrap once; remove after your environment is bootstrapped
            npx cdk bootstrap aws://706877673330/${AWS_REGION}
            npx cdk deploy ServicesStack-Test --require-approval never
          '''
        }
      }
    }

    stage('Manual Approval (prod branch)') {
      when { branch 'prod' }
      steps {
        input message: "Deploy to PROD?", ok: "Deploy"
      }
    }

    stage('Deploy Prod (prod branch)') {
      when { branch 'prod' }
      steps {
        withAWS(credentials: 'aws-creds', region: "${env.AWS_REGION}") {
          sh '''
            # Run bootstrap once; remove after your environment is bootstrapped
            npx cdk bootstrap aws://706877673330/${AWS_REGION}
            npx cdk deploy ServicesStack-Prod --require-approval never
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'npx cdk doctor || true'
      archiveArtifacts artifacts: 'cdk.out/**/*', fingerprint: true, allowEmptyArchive: true
    }
  }
}