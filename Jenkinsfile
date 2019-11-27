pipeline {
    agent {
        node {
            // Label expression that defines which agents may execute builds of this project
            label 'Prod'
            customWorkspace "C:/jenkins/workspace/${env.JOB_NAME}"
        }
    }
    libraries {
        lib('scp-augero-pipeline-lib')
    }
    options {
        // This option enables timestamps for console output in the jenkins job
        timestamps()
    }
    environment {
        // This environment sets the name of the repository this file is in so it can be used in the build step
        REPOSITORY_NAME = 'augero-spv'
        ORGANIZATION_NAME = 'Cerner Health Services Deutschland GmbH_DevelopmentPaaS'
        USERS = 'andre.ostermeier@sap.com<SpaceDeveloper>;andre.ostermeier@sap.com<SpaceManager>;Cristina.Philippi@Cerner.com<SpaceDeveloper>;vlad.fernoaga@cerner.com<SpaceDeveloper>;vlad.fernoaga@cerner.com<SpaceManager>;andreea.cojocaru@cerner.com<SpaceDeveloper>;maria.bolea@cerner.com<SpaceDeveloper>;ciobanu.vlad@cerner.com<SpaceDeveloper>;dagmar.fuehrer@cerner.com<SpaceDeveloper>;dagmar.fuehrer@cerner.com<SpaceManager>;Catalin.Balascuta@cerner.com<SpaceDeveloper>;Norbert.Paukner@cerner.com<SpaceDeveloper>;Norbert.Paukner@cerner.com<SpaceManager>;Claudiu.Rapea@cerner.com<SpaceDeveloper>;Ionut.Martinas@cerner.com<SpaceDeveloper>;PaulaBianca.Brinzea@cerner.com<SpaceDeveloper>;George.Nistor@cerner.com<SpaceDeveloper>;Mihai.Niculescu@cerner.com<SpaceDeveloper>;George.Miu@cerner.com<SpaceDeveloper>;George.Miu@cerner.com<SpaceManager>'
    }
    stages {
        stage('Prepare & Build'){
            failFast true
            parallel {
                stage('Create space'){
                    when {
                        not { expression { BRANCH_NAME ==~ /(PR-(.*)|develop|master|no-space-(.*))/ } }
                        expression { BUILD_ID == "1"}
                    }
                    steps {
                        createSpace(
                            organization: env.ORGANIZATION_NAME,
                            spaceName: env.BRANCH_NAME,
                            memory: '4096MB'
                        )
                        assignRolesToSpace(
                            organization: env.ORGANIZATION_NAME,
                            spaceName: env.BRANCH_NAME,
                            users: env.USERS
                        )
                    }       
                }
                stage('Build') {
                    steps {
                        // This step runs the build for the project
                        buildMtar(workspace: env.WORKSPACE, mtarName: env.REPOSITORY_NAME)
                    }
                }
                stage('Fortify scan') {
                    when { branch "develop" }
                    steps {
                        // https://github.cerner.com/scp/augero-tools/tree/develop/continuous-integration/tools/fortify
                        executeFortifyScan(workspace: env.WORKSPACE, repositoryName: env.REPOSITORY_NAME)
                    }
                }
            }
        }
        stage('Deploy & Check Frontend') {
            failFast false
            parallel {
                stage('Deploy') {
                    stages {
                        stage('Deploy for develop') {
                            when { branch "develop" }
                            steps {
                                // This step runs deploy on SPACE 'test'
                                deployMtar(workspace: env.WORKSPACE, organizationName: env.ORGANIZATION_NAME, spaceName: 'test', mtarName: env.REPOSITORY_NAME)
                            }
                        }
                        // Runs the Integration Test (only on the development branch)
//                        stage('Run Integration Tests') {
//                            when { branch "develop" }
//                            steps {
//                                powershell '''mvn -f spv-adaptation failsafe:integration-test -DcfSpace=test'''
//                            }
//                        }
                    } 
                }
                stage('Deploy for incubators') { 
                    stages {
                        stage('Deploy app for incubators') {
                            when { not { expression { BRANCH_NAME ==~ /(PR-(.*)|develop|no-space-(.*))/ } } }
                            steps {
                                // This step runs deploy on SPACE BRANCH_NAME
                                deployMtar(workspace: env.WORKSPACE, organizationName: env.ORGANIZATION_NAME, spaceName: env.BRANCH_NAME, mtarName: env.REPOSITORY_NAME)
                            }
                        }
//                         stage('Run Integration Tests for pull requests') {           
//                            when{ expression { BRANCH_NAME ==~ /^PR-[0-9]+.*$/ } }
//                            steps{
//                                // Runs the Integration Test (only on the PR branch)
//                                powershell "mvn -f spv-adaptation failsafe:integration-test -DcfSpace=${env.CHANGE_BRANCH}"
//                             }
//                         }
                    }
                }
                stage('Copy TEW') {
                    when { branch "develop" }
                    steps {
                        // This step triggers the script that copies the translation files from augero-spv to SAP git
                        copyTEW(repositoryName: env.REPOSITORY_NAME)
                    }
                }
                stage('Dependency check') {
                    when { branch "develop" }
                    steps {
                        // This step runs the dependency check analyze
                        // dependencyCheckAnalyzer datadir: '', hintsFile: '', includeCsvReports: false, includeHtmlReports: true, includeJsonReports: false, includeVulnReports: true, isAutoupdateDisabled: false, outdir: '', scanpath: '', skipOnScmChange: false, skipOnUpstreamChange: false, suppressionFile: '', zipExtensions: ''
                        dependencyCheckWrapper()
                    }
                }           
                stage('Frontend quality checks') {
                    stages{
                        // This stage runs SonarQube analyze for frontend
                        stage('SonarQube Scan Frontend') {
                            // This sets the tool name for SonarQube so the pipeline can access the directory where SonarQube is installed
                            environment {
                                sonarqubeScannerHome = tool name: 'SonarQube Scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                            }
                            steps {
                                executeSonarQubeScanFrontend(
                                    sonarqubeScannerHome: env.sonarqubeScannerHome,
                                    sonarProjectName: '''"SCP '''+env.REPOSITORY_NAME+''' frontend"''',
                                    sonarProjectKey: "${env.REPOSITORY_NAME}-frontend",
                                    testsPaths: 'spv-ui/webapp/TEST/unit/util',
                                    testExecutionReportPaths: 'spv-ui/reports/sonar/TESTS-qunit.xml',
                                    javascriptLcovReportPaths: 'spv-ui/reports/coverage/lcov.info'
                                )
                            }
                        }
                        // This stage checks the quality gate for frontend
                        stage("Quality Gate Frontend") {
                            steps {
                                // This step waits for the SonarQube Quality Gate and fails the build if the Quality Gate status is not OK
                                addSonarQubeQualityGateListener()
                            }
                        }
                    }
                }     
            }
        }
        // stage('SonarQube Scan Backend') {
        //     // This sets the tool name for SonarQube so the pipeline can access the directory where SonarQube is installed
        //     environment {
        //         sonarqubeScannerHome = tool name: 'SonarQube Scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
        //     }
        //     steps {
        //         executeSonarQubeScanBackend(
        //             sonarqubeScannerHome: env.sonarqubeScannerHome,
        //             sonarProjectName: '''"SCP '''+env.REPOSITORY_NAME+''' backend"''',
        //             sonarProjectKey: "${env.REPOSITORY_NAME}-backend",
        //             jacocoXmlReportPaths: './spv-adaptation/target/site/jacoco/jacoco.xml',
        //             junitReportPaths: './spv-adaptation/target/surefire-reports,./spv-adaptation/target/failsafe-reports'
        //         ) 
        //     }
        // }
        // This stage checks the quality gate for backend
        stage("Quality Gate Backend") {
            steps {
                // This step waits for the SonarQube Quality Gate and fails the build if the Quality Gate status is not OK
                addSonarQubeQualityGateListener()
            }
        }
        stage('Notify and cleanup') {
            steps {
                echo 'Send emails and cleanup directory'
            }
        }
    }
    post {
        always {
            addArtifactToBlueOcean(fileName: '.mta/log.txt')
            addUnitTestsToBlueOcean()
        }
        success {
            cleanWorkspace(workspace: env.WORKSPACE)
        }
        unsuccessful {
            sendEmails()
            logMtaFileToConsole(directory: '.')
        }
    }
}
