const AWS = require("aws-sdk");
const AWS_REGION = "us-east-2";
AWS.config.update({
  region: AWS_REGION,
});
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoDBTableName = "clinic-appointment";

const healthPath = "/aphealth";
const appointmentPath = "/appointment";
const appointmentsPath = "/appointments";
exports.handler = async function (event) {
  console.log("Request event" + event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === healthPath:
      response = buildResponse(200);
      const body = {
        Message: "Health Success",
      };
      break;
    case event.httpMethod === "GET" && event.path === appointmentPath:
      response = await getAppointment(event.queryStringParameters.apid);
      break;
    case event.httpMethod === "GET" && event.path === appointmentsPath:
      response = await getAppointments();
      break;
    case event.httpMethod === "POST" && event.path === appointmentPath:
      response = await saveAppointment(JSON.parse(event.body));
      break;
    case event.httpMethod === "PATCH" && event.path === appointmentPath:
      const requestBody = JSON.parse(event.body);
      response = await modifyAppointment(
        requestBody.apid,
        requestBody.updateKey,
        requestBody.updateValue
      );
      break;
    case event.httpMethod === "DELETE" && event.path === appointmentPath:
      response = await deleteAppointment(JSON.parse(event.body).apid);
      break;
    default:
      response = buildResponse(404, "404 Not Found");
  }
  return response;
};

//Specific Appointment GET
async function getAppointment(apid) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      apid: apid,
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

// All Appointments GET
async function getAppointments() {
  const params = { TableName: dynamoDBTableName };
  const allappointments = await scanDynamoRecords(params, []);
  const body = {
    appointments: allappointments,
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
// Appointment ADD POST 
async function saveAppointment(requestBody) {
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
async function modifyAppointment(apid, updateKey, updateValue) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      apid: apid,
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
// Delete a Appointment
async function deleteAppointment(apid) {
  const params = {
    TableName: dynamoDBTableName,
    Key: {
      apid: apid,
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