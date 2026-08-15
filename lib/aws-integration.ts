import AWS from "aws-sdk";
import fs from "fs/promises";
import path from "path";

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

// S3 Client
const s3Client = new AWS.S3({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId || "",
    secretAccessKey: awsConfig.secretAccessKey || "",
  },
});

// Rekognition Client (Face Detection)
const rekognitionClient = new AWS.Rekognition({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId || "",
    secretAccessKey: awsConfig.secretAccessKey || "",
  },
});

// DynamoDB for caching
const dynamodbClient = new AWS.DynamoDB.DocumentClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId || "",
    secretAccessKey: awsConfig.secretAccessKey || "",
  },
});

/**
 * Upload Photo to S3
 */
export async function uploadPhotoToS3(
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET || "ponto-facial-photos";
  const key = `attendance/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: "image/jpeg",
      ServerSideEncryption: "AES256",
      Metadata: {
        "upload-date": new Date().toISOString(),
        source: "ponto-facial",
      },
    };

    await s3Client.putObject(params).promise();
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    throw error;
  }
}

/**
 * Detect Face with AWS Rekognition
 */
export async function detectFaceAWS(
  imageBuffer: Buffer
): Promise<{
  faceFound: boolean;
  confidence: number;
  faceDetails: any;
}> {
  try {
    const params = {
      Image: {
        Bytes: imageBuffer,
      },
      Attributes: ["ALL"],
    };

    const response = await rekognitionClient
      .detectFaces(params)
      .promise();

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return {
        faceFound: false,
        confidence: 0,
        faceDetails: null,
      };
    }

    const face = response.FaceDetails[0];
    return {
      faceFound: true,
      confidence: (face.Confidence || 0) / 100,
      faceDetails: face,
    };
  } catch (error) {
    console.error("❌ Rekognition Error:", error);
    throw error;
  }
}

/**
 * Compare Faces with AWS Rekognition
 */
export async function compareFacesAWS(
  sourceImageBuffer: Buffer,
  targetImageBuffer: Buffer
): Promise<{
  isMatch: boolean;
  confidence: number;
  facePairs: any[];
}> {
  try {
    const params = {
      SourceImage: {
        Bytes: sourceImageBuffer,
      },
      TargetImage: {
        Bytes: targetImageBuffer,
      },
      SimilarityThreshold: 80,
    };

    const response = await rekognitionClient
      .compareFaces(params)
      .promise();

    return {
      isMatch: (response.FaceMatches || []).length > 0,
      confidence:
        ((response.FaceMatches?.[0]?.Similarity || 0) / 100),
      facePairs: response.FaceMatches || [],
    };
  } catch (error) {
    console.error("❌ Compare Faces Error:", error);
    throw error;
  }
}

/**
 * Search Employees in DynamoDB (Face Templates Cache)
 */
export async function searchFaceInDynamoDB(
  employeeId: string
): Promise<any | null> {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE || "ponto-facial-faces",
      Key: {
        pk: `EMPLOYEE#${employeeId}`,
        sk: "FACE_DATA",
      },
    };

    const result = await dynamodbClient.get(params).promise();
    return result.Item || null;
  } catch (error) {
    console.error("❌ DynamoDB Get Error:", error);
    return null;
  }
}

/**
 * Cache Face Template in DynamoDB
 */
export async function cacheFaceInDynamoDB(
  employeeId: string,
  faceData: any
): Promise<void> {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE || "ponto-facial-faces",
      Item: {
        pk: `EMPLOYEE#${employeeId}`,
        sk: "FACE_DATA",
        faceData: JSON.stringify(faceData),
        faceTimestamp: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90 days
      },
    };

    await dynamodbClient.put(params).promise();
  } catch (error) {
    console.error("❌ DynamoDB Put Error:", error);
  }
}

/**
 * Get Attendance Records from DynamoDB
 */
export async function getAttendanceRecordsDynamoDB(
  employeeId: string,
  days: number = 30
): Promise<any[]> {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const params = {
      TableName: process.env.DYNAMODB_TABLE || "ponto-facial-records",
      KeyConditionExpression: "pk = :pk AND sk > :sk",
      ExpressionAttributeValues: {
        ":pk": `ATTENDANCE#${employeeId}`,
        ":sk": dateThreshold.toISOString(),
      },
      ScanIndexForward: false, // DESC order
      Limit: 100,
    };

    const result = await dynamodbClient.query(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error("❌ DynamoDB Query Error:", error);
    return [];
  }
}

/**
 * Store Attendance Record in DynamoDB
 */
export async function storeAttendanceDynamoDB(
  employeeId: string,
  recordData: any
): Promise<void> {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE || "ponto-facial-records",
      Item: {
        pk: `ATTENDANCE#${employeeId}`,
        sk: new Date().toISOString(),
        data: recordData,
        ttl: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
      },
    };

    await dynamodbClient.put(params).promise();
  } catch (error) {
    console.error("❌ DynamoDB Put Error:", error);
  }
}

/**
 * Send Notification via SNS
 */
export async function sendNotificationSNS(
  topicArn: string,
  message: string,
  subject: string
): Promise<void> {
  try {
    const sns = new AWS.SNS({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId || "",
        secretAccessKey: awsConfig.secretAccessKey || "",
      },
    });

    const params = {
      TopicArn: topicArn,
      Subject: subject,
      Message: message,
    };

    await sns.publish(params).promise();
  } catch (error) {
    console.error("❌ SNS Publish Error:", error);
  }
}

/**
 * Log CloudWatch Metrics
 */
export async function logCloudWatchMetric(
  metricName: string,
  value: number,
  unit: string = "Count"
): Promise<void> {
  try {
    const cloudwatch = new AWS.CloudWatch({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId || "",
        secretAccessKey: awsConfig.secretAccessKey || "",
      },
    });

    const params = {
      Namespace: "PontoFacial",
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
        },
      ],
    };

    await cloudwatch.putMetricData(params).promise();
  } catch (error) {
    console.error("❌ CloudWatch Error:", error);
  }
}

/**
 * Get EC2 Instance Information
 */
export async function getEC2InstanceInfo(): Promise<any> {
  try {
    const ec2 = new AWS.EC2({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId || "",
        secretAccessKey: awsConfig.secretAccessKey || "",
      },
    });

    const params = {
      Filters: [
        {
          Name: "tag:Application",
          Values: ["ponto-facial"],
        },
      ],
    };

    const result = await ec2.describeInstances(params).promise();
    return result.Reservations || [];
  } catch (error) {
    console.error("❌ EC2 Error:", error);
    return [];
  }
}

export default {
  uploadPhotoToS3,
  detectFaceAWS,
  compareFacesAWS,
  searchFaceInDynamoDB,
  cacheFaceInDynamoDB,
  getAttendanceRecordsDynamoDB,
  storeAttendanceDynamoDB,
  sendNotificationSNS,
  logCloudWatchMetric,
  getEC2InstanceInfo,
};
