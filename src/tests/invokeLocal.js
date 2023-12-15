const { execSync } = require('child_process');

if (process.argv.length < 4) {
    console.error('Usage: node invokeLocal.js <functionName> <directory>');
    process.exit(1);
}

const stage = process.argv[4] || 'dev';
const directory = process.argv[2];
const functionName = process.argv[3];

const command = `serverless invoke local -f ${functionName} --stage ${stage} --path ./src/tests/${directory}/${functionName}.json`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
