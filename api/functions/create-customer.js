const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async function (event, context) {
  const data = JSON.parse(context.body)

  const customer = await stripe.customers.create({
    email: data.email
  })

  return {
    statusCode: 200,
    body: JSON.stringify(customer)
  }
}