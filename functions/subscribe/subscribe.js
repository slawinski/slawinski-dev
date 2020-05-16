const Mailchimp = require('mailchimp-api-v3')
const { MAILCHIMP_KEY } = process.env

exports.handler = async (event, context) => {
  const mailchimp = new Mailchimp(MAILCHIMP_KEY);
  const { email } = JSON.parse(event.body)

  const subscriber = {
    email_address : email,
    status : 'subscribed',
  }

  try {
    await mailchimp.post('/lists/41f22f2825/members/', subscriber)
    return {
      statusCode: 200,
      body: "Email subscribed"
    }
  } catch (err) {
    return {
      statusCode: err.code,
      body: JSON.stringify({ msg: err.message }),
    };
  }
};