"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const aws_1 = require("./aws");
const utils_1 = require("./utils");
const mongoose = require('mongoose');
const sqs = new aws_sdk_1.default.SQS({
    apiVersion: '2012-11-05',
    accessKeyId: 'AKIASRLANABZOYYOEBBS',
    secretAccessKey: '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',
    region: 'ap-south-1'
});
mongoose.connect('mongodb://127.0.0.1:27017/status')
    .then(() => {
    console.log("connection open");
})
    .catch((err) => {
    console.log(`error-->${err}`);
});
const Status = mongoose.model('Status', new mongoose.Schema({
    id: String,
    status: String
}));
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let messageAvailable = true;
            while (messageAvailable) {
                const receiveMessageParams = {
                    QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/174685225074/multiply',
                    MaxNumberOfMessages: 10, // Maximum number of messages to receive in a single call
                    WaitTimeSeconds: 10 // Long polling, the duration (in seconds) for which the call waits for a message to arrive in the queue before returning
                };
                const data = yield sqs.receiveMessage(receiveMessageParams).promise();
                // Check if there are any messages
                if (data.Messages && data.Messages.length > 0) {
                    for (const message of data.Messages) {
                        // Process the message
                        console.log("Received message:", message.Body);
                        yield (0, aws_1.downloadS3Folder)(`output/${message.Body}`);
                        console.log("downloaded");
                        if (typeof message.Body === 'string') {
                            yield (0, utils_1.buildProject)(message.Body);
                            yield (0, aws_1.copyFinalDist)(message.Body);
                            const status = yield Status.find({ id: message.Body });
                            status.status = "deployed";
                        }
                        // Ensure ReceiptHandle is defined
                        if (message.ReceiptHandle) {
                            const deleteMessageParams = {
                                QueueUrl: 'https://sqs.ap-south-1.amazonaws.com/174685225074/multiply',
                                ReceiptHandle: message.ReceiptHandle
                            };
                            yield sqs.deleteMessage(deleteMessageParams).promise();
                            console.log("Message deleted from the queue");
                        }
                        else {
                            console.error("Invalid ReceiptHandle, cannot delete message.");
                        }
                    }
                }
                else {
                    // No messages available in the queue, exit the loop
                    messageAvailable = false;
                    console.log("No more messages available in the queue.");
                }
            }
        }
        catch (err) {
            console.error("Error in main:", err);
        }
    });
}
exports.default = Main();
