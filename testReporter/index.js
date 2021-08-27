const fs = require('fs')
const AWS = require('aws-sdk')
const npmCheck = require('npm-check')
AWS.config.update({ region: 'us-east-1' })
const cloudwatch = new AWS.CloudWatch()

function getTestResults() {
    const x = fs.readFileSync('./coverage/coverage-summary.json')
    const grade = JSON.parse(x).total.statements.pct
    const size = JSON.parse(x).total.statements.total
    return {
        grade,
        size
    }
}

async function writeTestCoverageMetric({ coverage }) {
    const params = {
        MetricData: [
            {
                MetricName: 'Coverage',
                Dimensions: [
                    {
                        Name: 'App',
                        Value: 'frontend'
                    }
                ],
                Unit: 'Percent',
                Value: coverage
            }
        ],
        Namespace: 'deploy-test-coverage'
    }

    await cloudwatch.putMetricData(params).promise()
}

async function getPackateInfo() {
    const currentState = await npmCheck({})
    const p = currentState.get('packages')
    const res = p.map((x) => {
        if (!x.bump) {
            return {
                package: x.moduleName,
                age: 0
            }
        }
        const v = (x) => Number(x.split('.')[0])
        return {
            package: x.moduleName,
            age: v(x.latest) - v(x.installed)
        }
    })
    return {
        current: res.filter((x) => x.age === 0).length,
        minus1: res.filter((x) => x.age === 1).length,
        minus2: res.filter((x) => x.age > 1).length
    }
}

async function writeNpmPackageAgeMetric({ current, minus1, minus2 }) {
    const params = {
        MetricData: [
            {
                MetricName: '1-version-behind',
                Dimensions: [
                    {
                        Name: 'App',
                        Value: 'frontend'
                    }
                ],
                Unit: 'Count',
                Value: minus2
            },
            {
                MetricName: '2-version-behind',
                Dimensions: [
                    {
                        Name: 'App',
                        Value: 'frontend'
                    }
                ],
                Unit: 'Count',
                Value: minus1
            },
            {
                MetricName: 'current',
                Dimensions: [
                    {
                        Name: 'App',
                        Value: 'frontend'
                    }
                ],
                Unit: 'Count',
                Value: current
            }
        ],

        Namespace: 'npm-package-age'
    }

    await cloudwatch.putMetricData(params).promise()
}

class CloudwatchReporter {
    async onRunComplete() {
        const packageInfo = await getPackateInfo()
        await writeNpmPackageAgeMetric(packageInfo)

        const testResults = getTestResults()
        await writeTestCoverageMetric({
            coverage: testResults.grade,
            size: testResults.size
        })
    }
}

module.exports = CloudwatchReporter
