const AWS = require("aws-sdk");
const AWS_REGION = "us-east-2";
AWS.config.update({
  region: AWS_REGION,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBTableName = "clinic-doctor";

const healthPath = "/dhealth";
const doctorPath = "/doctor";
const doctorsPath = "/doctors";
exports.handler = async function (event) {
  console.log("Request event" + event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === healthPath:
      response = buildResponse(200);
      break;
    case event.httpMethod === "GET" && event.path === doctorPath:
      response = await getDoctor(event.queryStringParameters.did);
      break;
    case event.httpMethod === "GET" && event.path === doctorsPath:
      response = await getDoctors();
      break;
    case event.httpMethod === "POST" && event.path === doctorPath:
      response = await saveDoctor(JSON.parse(event.body));
      break;
    case event.httpMethod === "PATCH" && event.path === doctorPath:
      const requestBody = JSON.parse(event.body);
      response = await modifyDoctor(
        requestBody.did,
        requestBody.updateKey,
        requestBody.updateValue
      );
      break;
    case event.httpMethod === "DELETE" && event.path === doctorPath:
      response = await deleteDoctor(JSON.parse(event.body).did);
      break;
    default:
      response = buildResponse(404, "404 Not Found");
  }
  return response;
};

//Specific Doctor GET
async function getDoctor(did) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      did: did,
    },
  };
  return await dynamoDB
    .get(params)
    .promise()
    .then((response) => {
      return buildResponse(200, response.Item);
    },
      (err) => console.log("ERROR: ", err)
    );
}

// All Doctors GET
async function getDoctors() {
  const params = { TableName: dynamoDBTableName };
  const alldoctors = await scanDynamoRecords(params, []);
  const body = {
    doctors: alldoctors,
  };
  return buildResponse(200, body);
}
async function scanDynamoRecords(scanParams, itemArray) {
  try {

    const dynamoData = await dynamoDB.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);

    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  } catch (err) {
    console.log("ERROR in Scan Dynamo Records: ", err);
  }
}
// Doctor ADD POST 
async function saveDoctor(requestBody) {
  const params = {
    TableName: dynamoDBTableName,
    Item: requestBody,
  };
  return await dynamoDB
    .put(params)
    .promise()
    .then(() => {
      const body = {
        Operation: "SAVE",
        Message: "SUCCESS",
        Item: requestBody,
      };
      return buildResponse(200, body);
    }, (err) => {
      console.log("ERROR in Save Product: ", err);
    }
    );
}
async function modifyDoctor(did, updateKey, updateValue) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      did: did,
    },
    UpdateExpression: `set ${updateKey} = :value`,
    ExpressionAttributeValues: {
      ":value": updateValue,
    },
    ReturnValues: "UPDATED_NEW",
  };
  return await dynamoDB
    .update(params)
    .promise()
    .then(
      (response) => {
        const body = {
          Operation: "UPDATE",
          Message: "SUCCESS",
          UpdatedAttributes: response,
        };
        return buildResponse(200, body);
      }, (err) => {
        console.log("ERROR in Update Product: ", err);
      }
    );
}
// Delete a Doctor
async function deleteDoctor(did) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      did: did,
    },
    ReturnValues: "ALL_OLD",
  };
  return await dynamoDB
    .delete(params)
    .promise()
    .then((response) => {
      const body = {
        Operation: "DELETE",
        Message: "SUCCESS",
        Item: response,
      };
      return buildResponse(200, body);
    },
      (err) => {
        console.log("ERROR in Delete Product: ", err);
      }
    );
}

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}