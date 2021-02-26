const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async function (event, context) {
  const prices = await stripe.prices.list()
  return {
    statusCode: 200,
    body: JSON.stringify(prices)
  };
}