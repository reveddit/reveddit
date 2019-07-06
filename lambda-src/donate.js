import '@babel/polyfill'

require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const SUCCESS_URL = 'https://revddit.com/about?status=donate-success'
const CANCEL_URL = 'https://revddit.com/about?status=donate-cancel'

const statusCode = 200;
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode,
      headers,
      body: "This was not a POST request!"
    };
  }

  const data = JSON.parse(event.body);

  if (!data.amount || !data.frequency) {
    const message = "Required information is missing!";

    console.error(message);

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        status: "failed",
        message
      })
    };
  }

  let session

  try {
    if (data.frequency === 'once') {
      session = await stripe.checkout.sessions.create({
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        payment_method_types: ['card'],
        line_items: [{
          name: 'Donation',
          description: 'Donation to revddit.com',
          amount: data.amount * 100,
          currency: 'usd',
          quantity: 1
        }],
        submit_type: 'donate'
      })
    } else if (data.frequency === 'monthly') {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        subscription_data: {
          items: [{
            plan: process.env.STRIPE_SUBSCRIPTION_PLAN_ID,
            quantity: data.amount * 100
          }],
        },
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL
      })
    }
  } catch (e) {
    console.error(e.message);

    return {
      statusCode: 424,
      headers,
      body: JSON.stringify({
        status: "failed",
        message: e.message
      })
    }
  }
  return {
    statusCode,
    headers,
    body: JSON.stringify({
      sessionId: session.id
    })
  }
}
