const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async function (event, context) {
  const products = await stripe.products.list()
  return {
    statusCode: 200,
    body: JSON.stringify(products)
  };
}