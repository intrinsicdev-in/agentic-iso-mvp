import { S3 } from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

async function setupBucket() {
  const bucketName = process.env.AWS_S3_BUCKET!;
  
  try {
    // Check if bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`✅ Bucket '${bucketName}' already exists`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      // Bucket doesn't exist, create it
      try {
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Created bucket '${bucketName}'`);
      } catch (createError) {
        console.error('❌ Error creating bucket:', createError);
      }
    } else {
      console.error('❌ Error checking bucket:', error);
    }
  }
}

if (require.main === module) {
  setupBucket();
}

export { setupBucket };