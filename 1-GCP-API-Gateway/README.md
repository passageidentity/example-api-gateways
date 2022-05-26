<img src="https://storage.googleapis.com/passage-docs/passage-logo-gradient.svg" alt="Passage logo" style="width:250px;"/>

<img src="https://img.shields.io/badge/Google%20Cloud-informational?style=flat&logo=googlecloud&logoColor=white&color=4385F4"/>

# Passage Google Cloud API Gateway Example

This example uses Google's API Gateway to process authorization tokens (in the form of JWTs) to authenticate users. For example purposes, this example uses Cloud Functions for the backend services and a React frontend, but a number of different services and frmaeworks can be used.

JSON Web Tokens(JWTs) created with Passage are OIDC compliant and the API gateway can be configured to verify these authentication tokens with no code. Simply set up the API configuration to use Passage's [JWKS](https://tools.ietf.org/html/rfc7517). You can learn more about user authentication via GCP's API Gateway [here](https://cloud.google.com/api-gateway/docs/authenticating-users-jwt).


## Example Implementation

### (1) Create A Google Cloud Function
This Google Cloud Function will act as our 'server' that will process authenticated requests brokered from GCP's API Gateway which we will set up in the next step.
Below is an example of a Google Cloud Function you can use to fetch the email address of the currently authenticated user ([click here to view example file](./supporting/cloud-function/script.js)):
```javascript
const Passage = require("@passageidentity/passage-node");

/**
 * Responds with a user's information.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
 exports.user = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', '*');
  res.set('Access-Control-Allow-Methods', 'GET');
  
  // satisfy CORS preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  // extract JWT from original request forwarded by API Gateway
  const userInfo = req.headers['x-apigateway-api-userinfo'];
  const jwtPayload = JSON.parse(new Buffer(userInfo, 'base64').toString('ascii'));
  const userID = jwtPayload.sub;

  const passage = new Passage({
    appID: jwtPayload.iss,
    apiKey: process.env.PASSAGE_API_KEY,
  });

  const user = await passage.user.get(userID);
  
  return res.status(200).json(user);
};
```

Next, we need to make sure that the Passage Node SDK is accessible from within the Cloud Function ([click here to view example file](./supporting/cloud-function/package.json)):
```json
{
  "name": "user",
  "version": "0.0.1",
  "dependencies": {
    "@passageidentity/passage-node": "^1.8.0"
  }
}
```
Once the Cloud Function has been created, be sure to copy its Trigger URL for use in the API Gateway config YML file in the net step.

### (2) Create A GCP API Gateway
Create an API Gateway in the GCP console and set this file as your API Config, replacing the placeholder values:
```yml
swagger: '2.0'
info:
  title: user-gateway
  description: Sample API Gateway with a Google Cloud Function backend
  version: 1.0.0
paths:
  /user:
    get:
      operationId: getUser
      x-google-backend:
        # Your Cloud Function's trigger URL (endpooint that calls the function)
        address: TRIGGER_URL_FROM_PREVIOUS_STEP
      # This 'security' section enables the security definition set up below.
      security:
        - passage: []
      responses:
        '200':
          description: A successful response
    options:
      operationId: cors
      x-google-backend:
        # Your Cloud Function's trigger URL (endpooint that calls the function)
        address: TRIGGER_URL_FROM_PREVIOUS_STEP
      responses:
        '200':
          description: A successful response

securityDefinitions:
  # This 'passage' security definition enables the Passage JWKS endpoint to be used to verify JWTs.
  passage:
    authorizationUrl: ""
    flow: "implicit"
    type: "oauth2"
    # The 'iss' parameter of the JWT to be verified. In this case, your App ID found in Passage Console.
    x-google-issuer: "YOUR_PASSAGE_APP_ID"
    # The JWKS URL Passage provides for your App ID found in Passage Console.
    x-google-jwks_uri: "https://auth.passage.id/v1/apps/YOUR_PASSAGE_APP_ID/.well-known/jwks.json"
    # The 'aud' parameter of the JWT to be verified. In this case, it's your auth_origin which can be found in your app settings in Passage Console.
    x-google-audiences: "YOUR_SERVER_URL" # i.e. "http://localhost:3000", etc.
```
Note that the securityDefinitions section is critical for the Api Gateway to verify JWTs using the JWKS endpoint. Now that you've configured a GCP API Gateway to work with a Cloud Function, add the endpoint URL of the API Gateway to your .env file variable REACT_APP_GCP_GATEWAY_URL.


## Building the Client

Install dependencies
```bash
npm install
```

Configure environment variables so the app knows the correct API URL.

1. Copy the EXAMPLE.env file to your own .env file.
2. Replace the example variables with your own Passage App ID (from the [Passage Console](https://console.passage.id)) and your GCP API Gateway URL. To configure an example GCP API Gateway, follow the Example Implementation below.


Start the app in development mode
```bash
npm run start
```

The application will run on http://localhost:3000, which you can navigate to in your browser.

## Authenticate Requests With Passage

Navigate to [http://localhost:3000](http://localhost:3000) and see what it's like authenticating users using Passage with React via Google's API Gateway!

