const axios = require('axios');

const { CONVERTKIT_API_KEY } = process.env;

exports.handler = async (event, context) => {
  const { email } = JSON.parse(event.body);

  const subscriber = {
    api_key: CONVERTKIT_API_KEY,
    email: email,
  };

  try {
    await axios.post(
      'https://api.convertkit.com/v3/forms/1405772/subscribe',
      subscriber,
    );
    return {
      statusCode: 200,
      body: 'Email subscribed',
    };
  } catch (err) {
    return {
      statusCode: err.code,
      body: JSON.stringify({ msg: err.message }),
    };
  }
};
