const AWS = require("aws-sdk");
const moment = require("moment");
const { Parser } = require("json2csv");

const s3 = new AWS.S3({
  accessKeyId: "accessKeyId",
  secretAccessKey: "secretAccessKey",
  region: "region",
});

// TODO update env bucket name
const uploadAWS = async (filename, fields, data) => {
  const csv = new Parser({ fields, withBOM: true });
  const content = csv.parse(data);

  //   const Bucket = process.env.LOG_BUCKET_NAME;
  const Bucket = "caps-clinic-csv";
  const params = {
    Bucket,
    Key: `${moment().format("DD-MM-YYYY")}/${moment().format(
      "DD-MM-YYYY-HH"
    )}/${filename}`,
    Body: Buffer.from(content),
  };

  const options = {
    partSize: 10 * 1024 * 1024, // 10 MB
    queueSize: 10,
  };

  await s3
    .upload(params, options, (err) => {
      if (err) {
        logger.error("Upload AWS is failed.", err);
        return err;
      }
    })
    .promise();

  return null;
};

module.exports = {
  uploadAWS,
};
