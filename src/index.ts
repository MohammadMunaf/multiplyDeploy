import AWS from "aws-sdk";
import { downloadS3Folder ,copyFinalDist} from "./aws";
import { buildProject } from "./utils";
const mongoose = require('mongoose');

const sqs = new AWS.SQS({
    apiVersion: '2012-11-05',
    accessKeyId: 'AKIASRLANABZOYYOEBBS',
    secretAccessKey: '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',
    region: 'ap-south-1'
});

mongoose.connect('mongodb://127.0.0.1:27017/status')
    .then(() => {
        console.log("connection open");
    })
    .catch((err:Error|any) => {
        console.log(`error-->${err}`);
    })

    const Status = mongoose.model('Status', new mongoose.Schema({
        id: String,
        status: String
    }));

async function Main() {
    try {
        let messageAvailable = true;

        while (messageAvailable) {
            const receiveMessageParams = {
                QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/174685225074/multiply',
                MaxNumberOfMessages: 10, // Maximum number of messages to receive in a single call
                WaitTimeSeconds: 10 // Long polling, the duration (in seconds) for which the call waits for a message to arrive in the queue before returning
            };

            const data = await sqs.receiveMessage(receiveMessageParams).promise();

            // Check if there are any messages
            if (data.Messages && data.Messages.length > 0) {
                for (const message of data.Messages) {
                    // Process the message
                    console.log("Received message:", message.Body);
                    await downloadS3Folder(`output/${message.Body}`);
                    console.log("downloaded");
                    if(typeof message.Body==='string'){
                        await buildProject(message.Body);
                        await copyFinalDist(message.Body);
                        const status=await Status.find({id:message.Body});
                        status.status="deployed";
                    } 
                    

                    // Ensure ReceiptHandle is defined
                    if (message.ReceiptHandle) {
                        const deleteMessageParams = {
                            QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/174685225074/multiply',
                            ReceiptHandle: message.ReceiptHandle
                        };

                        await sqs.deleteMessage(deleteMessageParams).promise();
                        console.log("Message deleted from the queue");
                    } else {
                        console.error("Invalid ReceiptHandle, cannot delete message.");
                    }
                }
            } else {
                // No messages available in the queue, exit the loop
                messageAvailable = false;
                console.log("No more messages available in the queue.");
            }
        }
    } catch (err) {
        console.error("Error in main:", err);
    }
}

export default Main();

