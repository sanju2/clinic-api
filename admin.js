const AWS = require("aws-sdk");
const AWS_REGION = "us-east-2";
AWS.config.update({
  region: AWS_REGION,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBTableName = "clinic-admin";

const healthPath = "/ahealth";
const adminPath = "/admin";
const adminsPath = "/admins";
exports.handler = async function (event) {
  console.log("Request event" + event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === healthPath:
      response = await getHealth();
      break;
    case event.httpMethod === "GET" && event.path === adminPath:
      response = await getAdmin(event.queryStringParameters.aid);
      break;
    case event.httpMethod === "GET" && event.path === adminsPath:
      response = await getAdmins();
      break;
    case event.httpMethod === "POST" && event.path === adminPath:
      response = await saveAdmin(JSON.parse(event.body));
      break;
    case event.httpMethod === "PATCH" && event.path === adminPath:
      const requestBody = JSON.parse(event.body);
      response = await modifyAdmin(
        requestBody.aid,
        requestBody.updateKey,
        requestBody.updateValue
      );
      break;
    case event.httpMethod === "DELETE" && event.path === adminPath:
      response = await deleteAdmin(JSON.parse(event.body).aid);
      break;
    default:
      response = buildResponse(404, "404 Not Found");
  }
  return response;
};

// Health Return
async function getHealth() {
  return await dynamoDB
    .then(() => {
      const body = {
        Message: "Healthy API",
        Item: requestBody,
      };
      return buildResponse(200, body);
    }, (err) => {
      console.log("ERROR in Save Product: ", err);
    }
    );

}

//Specific Admin GET
async function getAdmin(aid) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      aid: aid,
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

// All admins GET
async function getAdmins() {
  const params = { TableName: dynamoDBTableName };
  const allAdmins = await scanDynamoRecords(params, []);
  const body = {
    admins: allAdmins,
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
// Admin ADD POST 
async function saveAdmin(requestBody) {
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
async function modifyAdmin(aid, updateKey, updateValue) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      aid: aid,
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
// Delete a Admin
async function deleteAdmin(aid) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      aid: aid,
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