const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async function (event, context) {
  const data = JSON.parse(event.body)

  try {
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: data.customerId,
    });
  } catch (error) {
    return {
      statusCode: 402,
      body: JSON.stringify({ error: { message: error.message } })
    }
  }

  // Change the default invoice settings on the customer to the new payment method
  await stripe.customers.update(
    data.customerId,
    {
      invoice_settings: {
        default_payment_method: data.paymentMethodId,
      },
    }
  );

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: data.customerId,
    items: [{ price: data.priceId }],
    expand: ['latest_invoice.payment_intent'],
  });

  return {
    statusCode: 200,
    body: JSON.stringify(subscription)
  }
}

