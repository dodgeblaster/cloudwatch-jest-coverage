const fs = require('fs')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const cloudwatch = new AWS.CloudWatch()

function getTestResults() {
    const x = fs.readFileSync('./coverage/coverage-summary.json')
    const getStatement = (x) => x.total.statements.pct
    const getSize = (x) => x.total.statements.total
    const grade = getStatement(JSON.parse(x))
    const size = getSize(JSON.parse(x))
    return {
        grade,
        size
    }
}

async function writeMetric({ coverage }) {
    const params = {
        MetricData: [
            {
                MetricName: 'Coverage',
                Dimensions: [
                    {
                        Name: 'Region',
                        Value: 'us-east-1'
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

class CloudwatchReporter {
    async onRunComplete() {
        const result = getTestResults()
        await writeMetric({
            coverage: result.grade,
            size: result.size
        })
    }
}

module.exports = CloudwatchReporter
