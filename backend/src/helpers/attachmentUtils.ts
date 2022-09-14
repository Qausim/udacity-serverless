import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'


const XAWS = AWSXRay.captureAWS(AWS)
const s3Instance = new XAWS.S3({
    signatureVersion: 'v4'
});

const s3BucketName = process.env.ATTACHMENT_S3_BUCKET;
const signedUrlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION, 10);

// TODO: Implement the fileStogare logic

export class AttachmentUtils {
    constructor(
        private s3: AWS.S3 = s3Instance,
        private bucketName: string = s3BucketName,
        private urlExpiration: number = signedUrlExpiration,
    ) {}

    getUploadSignedUrl(key: string) {
        return this.s3.getSignedUrl('putObject', {
            Key: key,
            Bucket: this.bucketName,
            Expires: this.urlExpiration,
        });
    }
    
    getDownloadSignedUrl(key: string) {
        return this.s3.getSignedUrl('getObject', {
            Key: key,
            Bucket: this.bucketName,
            Expires: this.urlExpiration,
        });
    }
}