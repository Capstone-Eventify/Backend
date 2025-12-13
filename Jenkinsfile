pipeline {
    agent any
    
    triggers {
        // Poll GitHub every 2 minutes for changes
        pollSCM('H/2 * * * *')
    }
    
    environment {
        DEV_SERVER = '3.15.170.92'
        QA_SERVER = '52.14.183.52'
        PROD_SERVER = '3.20.236.137'
        
        // No hardcoded emails - using Jenkins global variables instead!
        // Variables available from Jenkins: Developers, QA, Product, Backend
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Building Backend branch: ${env.BRANCH_NAME}"
                    checkout scm
                    
                    try {
                        def commitMsg = sh(returnStdout: true, script: 'git log -1 --pretty=%B').trim()
                        def commitAuthor = sh(returnStdout: true, script: 'git log -1 --pretty=%an').trim()
                        def commitEmail = sh(returnStdout: true, script: 'git log -1 --pretty=%ae').trim()
                        def commitHash = sh(returnStdout: true, script: 'git log -1 --pretty=%h').trim()
                        
                        env.COMMIT_MSG = commitMsg
                        env.COMMIT_AUTHOR = commitAuthor
                        env.COMMIT_EMAIL = commitEmail
                        env.COMMIT_HASH = commitHash
                        
                        echo "Commit: ${env.COMMIT_MSG}"
                        echo "Author: ${env.COMMIT_AUTHOR}"
                        echo "Email: ${env.COMMIT_EMAIL}"
                        echo "Hash: ${env.COMMIT_HASH}"
                    } catch (Exception e) {
                        echo "Could not fetch commit info: ${e.getMessage()}"
                        env.COMMIT_MSG = "Unable to fetch commit message"
                        env.COMMIT_AUTHOR = "Unknown"
                        env.COMMIT_EMAIL = ""
                        env.COMMIT_HASH = "N/A"
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }
        
        stage('Deploy to Dev') {
            when { branch 'staging' }
            steps {
                script {
                    deployBackendToServer(env.DEV_SERVER, 'dev-server-key', 'dev')
                }
            }
        }
        
        stage('Deploy to QA') {
            when { branch 'QA' }
            steps {
                script {
                    deployBackendToServer(env.QA_SERVER, 'qa-server-key', 'qa')
                }
            }
        }
        
        stage('Deploy to Production') {
            when { branch 'main' }
            steps {
                input message: 'Deploy Backend to Production?', ok: 'Deploy'
                script {
                    deployBackendToServer(env.PROD_SERVER, 'prod-server-key', 'prod')
                }
            }
        }
    }
    
    post {
        success {
            script {
                sendNotifications('success')
            }
        }
        
        failure {
            script {
                sendNotifications('failure')
            }
        }
        
        unstable {
            script {
                sendNotifications('unstable')
            }
        }
    }
}

// Main notification function
def sendNotifications(String status) {
    def environment = getEnvironmentName(env.BRANCH_NAME)
    def duration = currentBuild.durationString.replace(' and counting', '')
    
    def commitMsg = env.COMMIT_MSG ?: 'No commit message'
    def commitAuthor = env.COMMIT_AUTHOR ?: 'Unknown'
    def commitEmail = env.COMMIT_EMAIL ?: ''
    def commitHash = env.COMMIT_HASH ?: 'N/A'
    
    // Get recipients based on branch and status
    def recipients = getRecipients(env.BRANCH_NAME, status, commitEmail)
    
    echo "${status == 'success' ? '✅' : '❌'} Sending notifications"
    echo "Recipients: ${recipients}"
    
    // Send Email
    sendEmailNotification(recipients, environment, status, duration, commitMsg, commitAuthor, commitHash)
    
    // Send Slack
    sendSlackNotification(environment, status, duration, commitMsg, commitAuthor, commitHash)
}

// Determine recipients based on branch, status, and your team structure
def getRecipients(String branch, String status, String commitEmail) {
    // Get email lists from Jenkins global variables
    def developers = env.Developers ?: ''
    def qaTeam = env.QA ?: ''
    def product = env.Product ?: ''
    def backend = env.Backend ?: ''
    
    def recipientsList = []
    
    switch(branch) {
        case 'staging':
            // Development environment - notify developers and backend team
            recipientsList.add(developers)
            recipientsList.add(backend)
            if (status == 'failure' && commitEmail) {
                recipientsList.add(commitEmail) // Add commit author on failures
            }
            break
            
        case 'QA':
            // QA environment - notify QA team, backend, and product on failures
            recipientsList.add(qaTeam)
            recipientsList.add(backend)
            if (status == 'failure') {
                recipientsList.add(product)
                if (commitEmail) {
                    recipientsList.add(commitEmail)
                }
            }
            break
            
        case 'main':
            // Production environment
            recipientsList.add(backend)
            recipientsList.add(product)
            if (status == 'failure') {
                // On production failures, notify everyone
                recipientsList.add(developers)
                recipientsList.add(qaTeam)
                if (commitEmail) {
                    recipientsList.add(commitEmail)
                }
            }
            break
            
        default:
            // Feature branches - only backend team and commit author
            recipientsList.add(backend)
            if (commitEmail) {
                recipientsList.add(commitEmail)
            }
    }
    
    // Filter out empty strings, remove duplicates, and join
    def uniqueRecipients = recipientsList.findAll { it && it.trim() }.unique().join(',')
    
    return uniqueRecipients ?: 'thilakediga321@gmail.com' // Fallback email
}

// Send email notification
def sendEmailNotification(String recipients, String environment, String status, String duration, String commitMsg, String commitAuthor, String commitHash) {
    if (!recipients || recipients.trim().isEmpty()) {
        echo "⚠️ No email recipients configured, skipping email"
        return
    }
    
    def statusEmoji = status == 'success' ? '✅' : (status == 'failure' ? '❌' : '⚠️')
    def statusText = status.toUpperCase()
    
    def subject = "${statusEmoji} Backend ${statusText}: ${environment} - Build #${env.BUILD_NUMBER}"
    
    def body = """
${statusEmoji} BACKEND BUILD ${statusText}

ENVIRONMENT: ${environment}
BRANCH: ${env.BRANCH_NAME}
BUILD NUMBER: ${env.BUILD_NUMBER}
DURATION: ${duration}

COMMIT INFORMATION:
📝 Message: ${commitMsg}
👤 Author: ${commitAuthor}
🔗 Hash: ${commitHash}

${status == 'failure' ? '⚠️ ACTION REQUIRED: Please check the console output for error details.\n' : ''}
VIEW BUILD: ${env.BUILD_URL}
CONSOLE OUTPUT: ${env.BUILD_URL}console

---
Automated Jenkins CI/CD Notification
"""
    
    try {
        mail(
            to: recipients,
            subject: subject,
            body: body
        )
        echo "✅ Email sent successfully to: ${recipients}"
    } catch (Exception e) {
        echo "❌ Failed to send email: ${e.getMessage()}"
    }
}

// Send Slack notification
def sendSlackNotification(String environment, String status, String duration, String commitMsg, String commitAuthor, String commitHash) {
    def emoji = status == 'success' ? ':white_check_mark:' : (status == 'failure' ? ':x:' : ':warning:')
    def color = status == 'success' ? 'good' : (status == 'failure' ? 'danger' : 'warning')
    def statusText = status == 'success' ? 'Succeeded' : (status == 'failure' ? 'Failed' : 'Unstable')
    
    def message = "${emoji} *Backend Build ${statusText}!* ${status == 'success' ? ':tada:' : ':boom:'}\n\n" +
                  "*Environment:* ${environment}\n" +
                  "*Branch:* `${env.BRANCH_NAME}`\n" +
                  "*Build:* <${env.BUILD_URL}|#${env.BUILD_NUMBER}>\n" +
                  "*Duration:* ${duration}\n\n" +
                  "*Commit Information:*\n" +
                  ":memo: ${commitMsg}\n" +
                  ":bust_in_silhouette: ${commitAuthor}\n" +
                  ":link: `${commitHash}`\n\n" +
                  (status == 'failure' ? ":warning: *Action Required:* Check logs for error details\n" : "") +
                  "<${env.BUILD_URL}console|View Console Output>"
    
    try {
        slackSend(
            channel: '#team1',
            color: color,
            tokenCredentialId: 'Slack',
            message: message
        )
        echo "✅ Slack notification sent to #team1"
    } catch (Exception e) {
        echo "⚠️ Slack notification failed: ${e.getMessage()}"
    }
}

// Helper function to get environment name
def getEnvironmentName(String branch) {
    switch(branch) {
        case 'main':
            return ':rocket: Production'
        case 'QA':
            return ':test_tube: QA'
        case 'staging':
            return ':wrench: Development'
        default:
            return ':herb: ' + branch
    }
}

def deployBackendToServer(String server, String credentials, String env) {
    sshagent([credentials]) {
        sh """
            ssh -o StrictHostKeyChecking=no ec2-user@${server} '
                cd /opt/eventify/${env}
                
                # Stop backend service
                pm2 stop eventify-${env}-backend || true
                
                # Deploy backend
                if [ -d backend ]; then
                    cd backend
                    git fetch origin ${BRANCH_NAME}
                    git reset --hard origin/${BRANCH_NAME}
                else
                    git clone -b ${BRANCH_NAME} https://github.com/Capstone-Eventify/Backend.git backend
                    cd backend
                fi
                
                # Install dependencies
                npm install --prefer-offline --no-audit || {
                    echo "Backend npm install failed, retrying..."
                    sleep 5
                    npm install --prefer-offline --no-audit
                }
                
                # Generate Prisma Client
                echo "🔧 Generating Prisma Client..."
                npx prisma generate || echo "⚠️ Prisma generate failed, continuing..."
                
                # Run database migrations
                echo "🗄️ Running database migrations..."
                npx prisma migrate deploy || echo "⚠️ Migration failed, continuing..."
                
                cd ..
                
                # Start/restart backend
                pm2 restart eventify-${env}-backend || pm2 start src/server.js --name "eventify-${env}-backend"
                pm2 save
                
                echo "✅ Backend deployed successfully"
                pm2 status
                
                # Health check
                echo "🔍 Checking backend health..."
                sleep 5
                curl -f http://localhost:5001/api/health || echo "⚠️ Health check failed - service may still be starting"
            '
        """
    }
}

