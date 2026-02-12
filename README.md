# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands
# 🚀 Jenkins CI/CD Setup — AWS EC2 + GitHub + CDK Deployment

This document describes the complete setup of a Jenkins CI/CD server hosted on an **AWS EC2 instance**, including installation steps, GitHub integration, AWS integration for CDK deployments, and required tools (Java, Node, Python, AWS CLI).  
Use this documentation before deleting or rebuilding the Jenkins EC2 instance.

---

## 📌 Table of Contents
- [EC2 Instance Setup](#ec2-instance-setup)
- [Install Java](#install-java)
- [Install Jenkins](#install-jenkins)
- [Install Python](#install-python)
- [Install AWS CLI](#install-aws-cli)
- [Connect Jenkins with AWS](#connect-jenkins-with-aws)
- [Connect Jenkins with GitHub](#connect-jenkins-with-github)
- [Jenkins NodeJS Tool Setup](#jenkins-nodejs-tool-setup)
- [Pipeline Setup](#pipeline-setup)
- [AWS CDK Deployment through Jenkins](#aws-cdk-deployment-through-jenkins)
- [Tools Installed on EC2](#tools-installed-on-ec2)
- [Before Deleting the EC2 Instance](#before-deleting-the-ec2-instance)

---

## EC2 Instance Setup

Jenkins was installed on an **Amazon Linux 2 / RHEL‑based EC2 instance**.

### Update system and install base tools
~~~sh
sudo yum update -y
sudo yum install git -y
sudo yum install python3 -y
sudo alternatives --set python /usr/bin/python3
~~~

---

## Install Java

Jenkins requires Java (OpenJDK / Corretto).

~~~sh
sudo yum install java-17-amazon-corretto -y
java -version
~~~

---

## Install Jenkins

**Reference:** https://www.jenkins.io/doc/book/installing/linux/#red-hat-centos

### Add Jenkins repo
~~~sh
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
~~~

### Install Jenkins
~~~sh
sudo yum upgrade -y
sudo yum install jenkins -y
~~~

### Start Jenkins
~~~sh
sudo systemctl enable jenkins
sudo systemctl start jenkins
sudo systemctl status jenkins
~~~

### Unlock Jenkins
~~~sh
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
~~~

### Open port 8080 in EC2 Security Group
* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template



Type: Custom TCP
Port: 8080
Source: 


Access Jenkins at:  
`http://<EC2-PUBLIC-IP>:8080`

---

## Install Python

Required for Semgrep and other tools.

~~~sh
sudo yum install python3-pip -y
pip3 install --upgrade pip
python3 -m venv .venv
~~~

---

## Install AWS CLI

~~~sh
sudo yum install awscli -y
aws --version
~~~

---

## Connect Jenkins with AWS

### Add AWS credentials in Jenkins
1. Manage Jenkins → **Manage Credentials**  
2. Add new credentials:
   - **Kind:** AWS Credentials  
   - **ID:** `aws-creds`  
   - **Access Key ID**  
   - **Secret Access Key**

### Test inside pipeline
~~~groovy
withAWS(credentials: 'aws-creds', region: 'ap-south-1') {
  sh 'aws sts get-caller-identity'
}
~~~

---

## Connect Jenkins with GitHub

### Install Plugins
- GitHub Integration  
- Git Plugin  
- GitHub Branch Source  
- Pipeline  
- NodeJS  

### Create GitHub Personal Access Token
GitHub → **Settings → Developer Settings → Personal Access Tokens** → Generate

**Required scopes:**
- `repo`
- `admin:repo_hook`

### Add credentials in Jenkins
- **Kind:** Username + Password  
- **ID:** `github-creds`  
- **Username:** GitHub username  
- **Password:** Personal Access Token (PAT)


Payload URL: http://:8080/github-webhook/
Content type: application/json
Events: Push events

---

## Jenkins NodeJS Tool Setup

Jenkins → **Manage Jenkins → Global Tool Configuration** → **NodeJS**

Add:
- **Name:** `node18`
- **Version:** Node.js 18.x (automatic installer)

Used in Jenkinsfile:
~~~groovy
tools {
  nodejs "node18"
}
~~~

---

## Pipeline Setup

Create a **Multibranch Pipeline**:

1. Jenkins → **New Item**  
2. Select **Multibranch Pipeline**  
3. Add GitHub repository URL  
4. Use credentials: `github-creds`  
5. Jenkins automatically detects branches with a `Jenkinsfile`

---

## AWS CDK Deployment through Jenkins

From your Jenkinsfile:
~~~groovy
withAWS(credentials: 'aws-creds', region: "${env.AWS_REGION}") {
  npx cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${AWS_REGION}
  npx cdk deploy ServicesStack-Test --require-approval never
}
~~~

This performs:
- AWS authentication  
- CDK bootstrap  
- CDK deployment  

> **Note:** Run `cdk bootstrap` **only once per AWS account/region**.

---

## Tools Installed on EC2

- **Java 17 (Amazon Corretto)** — required for Jenkins  
- **Jenkins** — CI/CD server  
- **Git** — source control  
- **Python 3 + pip** — used for Semgrep and scripts  
- **Node.js (via Jenkins NodeJS tool)** — for npm/CDK  
- **AWS CLI** — AWS auth/utilities  
- **AWS CDK (as project dependency)** — IaC deployment

---
## Before Deleting the EC2 Instance

- [ ] Export Jenkins jobs/config (if needed)  
- [ ] Backup Jenkins credentials (AWS + GitHub)  
- [ ] Backup `/var/lib/jenkins/` if you need job history  
- [ ] Save GitHub PAT (or regenerate later)  
- [ ] Save/rotate AWS Access Keys  
- [ ] Copy the `Jenkinsfile` and this `README.md`
