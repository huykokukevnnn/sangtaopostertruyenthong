const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

async function processImage(imageName) {
    const inputPath = path.join(__dirname, 'public/assets', imageName);
    const outputPath = path.join(__dirname, 'public/assets', imageName);
    
    console.log(`Processing ${imageName}...`);
    try {
        const fileUri = 'file:///' + inputPath.replace(/\\/g, '/');
        const blob = await removeBackground(fileUri);
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fs.writeFileSync(outputPath, buffer);
        console.log(`Successfully processed ${imageName}`);
    } catch (e) {
        console.error(`Error processing ${imageName}:`, e);
    }
}

async function main() {
    await processImage('prop_bone.png');
    await processImage('prop_ball.png');
}

main();
