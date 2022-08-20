const AWS = require("aws-sdk");
const AWS_REGION = "us-east-2";
AWS.config.update({
  region: AWS_REGION,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBTableName = "clinic-user";

const healthPath = "/uhealth";
const userPath = "/user";
const usersPath = "/users";
exports.handler = async function (event) {
  console.log("Request event" + event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === healthPath:
      response = buildResponse(200);
      break;
    case event.httpMethod === "GET" && event.path === userPath:
      response = await getUser(event.queryStringParameters.uid);
      break;
    case event.httpMethod === "GET" && event.path === usersPath:
      response = await getUsers();
      break;
    case event.httpMethod === "POST" && event.path === userPath:
      response = await saveUser(JSON.parse(event.body));
      break;
    case event.httpMethod === "PATCH" && event.path === userPath:
      const requestBody = JSON.parse(event.body);
      response = await modifyUser(
        requestBody.uid,
        requestBody.updateKey,
        requestBody.updateValue
      );
      break;
    case event.httpMethod === "DELETE" && event.path === userPath:
      response = await deleteUser(JSON.parse(event.body).uid);
      break;
    default:
      response = buildResponse(404, "404 Not Found");
  }
  return response;
};

//Specific User GET
async function getUser(uid) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      uid: uid,
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

// All Users GET
async function getUsers() {
  const params = { TableName: dynamoDBTableName };
  const allUsers = await scanDynamoRecords(params, []);
  const body = {
    users: allUsers,
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
// User ADD POST 
async function saveUser(requestBody) {
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
async function modifyUser(uid, updateKey, updateValue) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      uid: uid,
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
// Delete a User
async function deleteUser(uid) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      uid: uid,
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