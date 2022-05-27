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
