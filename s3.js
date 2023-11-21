import AWS from "aws-sdk";
import moment from "./moment.js";
import { Parser } from "json2csv";
import dotenv from "dotenv";
dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: "ap-northeast-1",
});

const uploadAWS = async (filename, fields, data) => {
  try {
    const csv = new Parser({ fields, withBOM: true });
    const content = csv.parse(data);

    const Bucket = process.env.BUCKET_NAME;
    const params = {
      Bucket,
      Key: `${moment().format("YYYY-MM-DD")}/${moment().format(
        "YYYY-MM-DD-HH"
      )}/${filename}`,
      Body: Buffer.from(content),
      ContentType: "text/csv",
    };

    await s3
      .putObject(params, (err) => {
        if (err) {
          console.error("Upload AWS is failed.", err);
          return err;
        }
      })
      .promise();

    return null;
  } catch (error) {
    console.error("Upload AWS is error.", error);
  }
};

export default {
  uploadAWS,
};
