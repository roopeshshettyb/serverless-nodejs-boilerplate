const fs = require('fs');
const path = require('path');

function convertFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');

    // Replace require statements with import statements
    const newData = data
        .replace(/import\s+{\s*(.*?)\s*}\s+from\s+['"](.*?)['"];/g, 'const { $1 } = require(\'$2\');')
        .replace(/import\s+(.*?)\s+from\s+['"](.*?)['"];/g, 'const $1 = require(\'$2\');')
        .replace(/export\s+{\s*(.*?)\s*};/g, 'module.exports = { $1 };')
        .replace(/export\s+default\s+(.*?);/g, 'module.exports = $1;');

    fs.writeFileSync(filePath, newData, 'utf8');
}

function convertDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile() && path.extname(file) === '.js') {
            convertFile(filePath);
        } else if (stats.isDirectory()) {
            convertDirectory(filePath);
        }
    }
}

function commentOutServerlessBundle(yamlFilePath) {
    try {
        // Read the YAML file
        let yamlContent = fs.readFileSync(yamlFilePath, 'utf8');

        // Comment out the "serverless-bundle" text
        yamlContent = yamlContent.replace(/- serverless-bundle/g, '# - serverless-bundle');

        // Write the modified content back to the file
        fs.writeFileSync(yamlFilePath, yamlContent);

        console.log('serverless-bundle text commented out successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
}

const srcDir = './src'; // Change this to the path of your src folder
convertDirectory(srcDir);

const yamlFilePath = 'serverless.yml';
commentOutServerlessBundle(yamlFilePath);