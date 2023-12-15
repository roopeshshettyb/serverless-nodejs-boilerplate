const fs = require('fs');
const path = require('path');

function convertFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');

    // Replace require statements with import statements
    const newData = data
        .replace(/const\s+{\s*(.*?)\s*}\s*=\s*require\(\s*['"](.*?)['"]\s*\);/g, 'import { $1 } from "$2";')
        .replace(/const\s+(.*?)\s*=\s*require\(\s*['"](.*?)['"]\s*\);/g, 'import $1 from "$2";')
        .replace(/module.exports\s*=\s*{(.*?)}/g, 'export {$1}')
        .replace(/module.exports\s*=\s*(.*?);/g, 'export default $1;')
        .replace(/const\s+(.*?)\s*=\s*require\(\s*['"](.*?)['"]\s*\);/g, 'import $1 from "$2";')
        .replace(/const\s+(.*?)\s*=\s*require\(\s*['"](.*?)['"]\s*\);/g, 'import $1 from "$2";');

    fs.writeFileSync(filePath, newData, 'utf8');
}

function unCommentOutServerlessBundle(yamlFilePath) {
    try {
        // Read the YAML file
        let yamlContent = fs.readFileSync(yamlFilePath, 'utf8');

        // Comment out the "serverless-bundle" text
        yamlContent = yamlContent.replace(/# - serverless-bundle/g, '- serverless-bundle');

        // Write the modified content back to the file
        fs.writeFileSync(yamlFilePath, yamlContent);

        console.log('serverless-bundle text commented out successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
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

const srcDir = './src'; // Change this to the path of your src folder
convertDirectory(srcDir);
const yamlFilePath = 'serverless.yml';
unCommentOutServerlessBundle(yamlFilePath);