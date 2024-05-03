const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const mime = require('mime-types');

const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials:{
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const PROJECT_ID = process.env.PROJECT_ID;

async function init(){
    console.log('Executing script.js');
    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)
//  p.stdout is used to get the output of the command that is executed in the terminal 
    p.stdout.on('data', function(data){
        console.log(data);
    });

    p.stdout.on('error', function(data){
        console.log('Error', data.toString());
    })

     p.on('close', async function(){
        console.log('Script.js executed successfully, Build complete');
        const distFolderPath = path.join(__dirname, 'output', 'dist')
        const distFolderContents = fs.readdirSync(distFolderPath,{recursive : true})

        for(const file of distFolderContents){
            const filePath = path.join(distFolderPath, file);
            console.log(filePath);
            // Check if the file is a directory or not in case of directory skip the file
            if(fs.lstatSync(filePath).isDirectory())continue;
            console.log('Uploading file to S3 bucket', filePath)

            const command = new PutObjectCommand({
                 Bucket: 'vercel-project-output-bucket',
                 Key: `__outputs/${PROJECT_ID}/${file}`,

                 //body is used to read the file and upload it to the s3 bucket
                 Body: fs.createReadStream(filePath),
                 ContentType:mime.lookup(filePath) || 'application/octet-stream' 
                })
                
                await s3Client.send(command);
                console.log('File uploaded to S3 bucket successfully', filePath)
            }
            console.log('All files uploaded to S3 bucket successfully')
        })
}

init();