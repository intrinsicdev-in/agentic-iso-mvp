"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBucketPolicy = setupBucketPolicy;
const aws_sdk_1 = require("aws-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
});
async function setupBucketPolicy() {
    const bucketName = process.env.AWS_S3_BUCKET;
    // Bucket policy to allow public read access
    const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `arn:aws:s3:::${bucketName}/*`
            }
        ]
    };
    try {
        await s3.putBucketPolicy({
            Bucket: bucketName,
            Policy: JSON.stringify(bucketPolicy)
        }).promise();
        console.log(`✅ Set public read policy for bucket '${bucketName}'`);
    }
    catch (error) {
        console.error('❌ Error setting bucket policy:', error);
    }
}
async function listBucketObjects() {
    const bucketName = process.env.AWS_S3_BUCKET;
    try {
        const result = await s3.listObjectsV2({
            Bucket: bucketName,
            Prefix: 'artefacts/'
        }).promise();
        console.log(`📁 Found ${result.KeyCount} objects in bucket '${bucketName}':`);
        result.Contents?.forEach(obj => {
            console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
        });
    }
    catch (error) {
        console.error('❌ Error listing objects:', error);
    }
}
async function main() {
    console.log('🔧 Setting up MinIO bucket permissions...');
    await setupBucketPolicy();
    await listBucketObjects();
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=setup-minio-permissions.js.map