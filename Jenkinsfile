pipeline {
  agent any

  environment {
    AWS_REGION         = "ap-south-1"
    AWS_DEFAULT_REGION = "ap-south-1"
    CDK_DEFAULT_REGION = "ap-south-1"
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
          set -euo pipefail
          node -v
          npm -v
          npm ci
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -euo pipefail
          npm run build
        '''
      }
    }

    /**
     * Resolve AWS Account from Jenkins AWS credentials
     * This prevents invalid CDK_DEFAULT_ACCOUNT values (like "706877 673330")
     */
    stage('Resolve AWS Env (Account/Region)') {
      steps {
        withAWS(credentials: 'aws-creds', region: "${env.AWS_REGION}") {
          script {
            def acct = sh(
              script: "aws sts get-caller-identity --query Account --output text | tr -d '[:space:]'",
              returnStdout: true
            ).trim()

            env.CDK_DEFAULT_ACCOUNT = acct
            echo "Resolved CDK_DEFAULT_ACCOUNT=${env.CDK_DEFAULT_ACCOUNT}"
            echo "Using CDK_DEFAULT_REGION=${env.CDK_DEFAULT_REGION}"
          }
        }
      }
    }

   stage('Security Scans (SAST + SCA + IaC)') {
  steps {
    sh '''
      set -euo pipefail

      echo "== Prepare local tools directory =="
      mkdir -p .tools/bin
      export PATH="$PWD/.tools/bin:$PATH"

      echo "== Ensure pip is available =="
      # Try ensurepip first (works if python is built with it)
      python3 -m ensurepip --upgrade || true

      # If pip is still missing, bootstrap it using get-pip.py (no sudo required)
      if ! python3 -m pip --version >/dev/null 2>&1; then
        echo "pip not found. Bootstrapping pip via get-pip.py..."
        curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py
        python3 get-pip.py --user
      fi

      # Make sure user-installed scripts are on PATH (semgrep installs here)
      export PATH="$HOME/.local/bin:$PATH"

      echo "== Install Semgrep (SAST) =="
      python3 -m pip install --user --upgrade semgrep
      semgrep --version

      echo "== Install Trivy (Vuln/Secrets/IaC) =="
      curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b .tools/bin
      trivy --version

      echo "== SCA: npm audit =="
      npm ci
      npm audit --audit-level=high || true

      echo "== SAST: Semgrep scan =="
      semgrep --config p/ci --error

      echo "== CDK Synth (for IaC output) =="
      npx cdk synth

      echo "== Trivy filesystem scan (repo) =="
      trivy fs . --severity HIGH,CRITICAL --exit-code 1 --no-progress || true

      echo "== Trivy IaC scan (cdk.out) =="
      trivy config cdk.out --severity HIGH,CRITICAL --exit-code 1 --no-progress
    '''
  }
}

    // Optional: Keep this stage if you want synth separately (it will re-run synth).
    // If you keep it, remove "npx cdk synth" from Security Scans to avoid duplicate work.
    stage('CDK Synth') {
      steps {
        sh '''
          set -euo pipefail
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
            set -euo pipefail
            # Run bootstrap once; remove after environment is bootstrapped
            npx cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${AWS_REGION}
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
            set -euo pipefail
            # Run bootstrap once; remove after environment is bootstrapped
            npx cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${AWS_REGION}
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