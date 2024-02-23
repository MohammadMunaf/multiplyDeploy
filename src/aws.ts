
import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path"

const s3 = new S3({
    accessKeyId: "AKIASRLANABZK6AZQ5FF",
    secretAccessKey: "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",
})



// output/asdasd
export async function downloadS3Folder(prefix: string) {
    const allFiles = await s3.listObjectsV2({
        Bucket: "multiplyvercel",
        Prefix: prefix
    }).promise();

    // [output/asdcsb/index.html, output/asdcsb/index.css]
    const allPromises = allFiles.Contents?.map(async ({ Key }) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname, Key);  //dist/output/123455/src/
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            console.log(dirName);
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: "multiplyvercel",
                Key
            }).createReadStream().pipe(outputFile).on("finish", () => {
                resolve("");
            })
        })
    }) || []
    console.log("awaiting");
    await Promise.all(allPromises?.filter(x => x !== undefined));
    console.log("running");
}

///////////
export function copyFinalDist(id: string) {
    const folderPath = path.join(__dirname, `output/${id}/dist`).replace(/\\/g, '/');
    const allFiles = getAllFiles(folderPath);
    allFiles.forEach(file => {
        uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
    })
}

const getAllFiles = (folderPath: string) => {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath))
        } else {
            response.push(fullFilePath.replace(/\\/g, '/'));
        }
    });
    return response;
}

const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "multiplyvercel",
        Key: fileName,
    }).promise();
    console.log(response);
}