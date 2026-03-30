pipeline {
  agent any

  environment {
    DOCKERHUB_USER = 'hirthicks'
    BACKEND_REPO = "${DOCKERHUB_USER}/tce-backend"
    FRONTEND_REPO = "${DOCKERHUB_USER}/tce-frontend"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    DEPLOY_HOST = 'your-server-hostname-or-ip'
    DEPLOY_USER = 'deploy'
    DEPLOY_PATH = '/opt/tce-project'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Backend Image') {
      steps {
        sh 'docker build -f docker/backend/Dockerfile -t $BACKEND_REPO:$IMAGE_TAG -t $BACKEND_REPO:latest .'
      }
    }

    stage('Build Frontend Image') {
      steps {
        sh 'docker build -f docker/frontend/Dockerfile -t $FRONTEND_REPO:$IMAGE_TAG -t $FRONTEND_REPO:latest .'
      }
    }

    stage('Run Backend Tests') {
      steps {
        withCredentials([string(credentialsId: 'groq-api-key', variable: 'GROQ_API_KEY')]) {
          sh '''
            docker run --rm \
              -e GROQ_API_KEY="$GROQ_API_KEY" \
              -e GENAI_PROVIDER=groq \
              $BACKEND_REPO:$IMAGE_TAG \
              python /app/test_groq_connection.py
          '''
        }
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
          sh '''
            echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
            docker push $BACKEND_REPO:$IMAGE_TAG
            docker push $BACKEND_REPO:latest
            docker push $FRONTEND_REPO:$IMAGE_TAG
            docker push $FRONTEND_REPO:latest
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([sshUserPrivateKey(credentialsId: 'deploy-server-ssh', keyFileVariable: 'SSH_KEY', usernameVariable: 'DEPLOY_USER')]) {
          sh '''
            mkdir -p ~/.ssh
            chmod 700 ~/.ssh
            ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts
            ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" "
              cd $DEPLOY_PATH/docker &&
              BACKEND_IMAGE=$BACKEND_REPO:latest \
              FRONTEND_IMAGE=$FRONTEND_REPO:latest \
              docker compose -f docker-compose.prod.yml pull &&
              BACKEND_IMAGE=$BACKEND_REPO:latest \
              FRONTEND_IMAGE=$FRONTEND_REPO:latest \
              docker compose -f docker-compose.prod.yml up -d --remove-orphans
            "
          '''
        }
      }
    }
  }
}
