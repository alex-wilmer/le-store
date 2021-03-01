const stripe = require('stripe')(process.env.STRIPE_SECRET);
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const port = 5555

app.use(cors())
app.use(bodyParser.json())

// app.get('/', async (req, res) => {
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: 1000,
//     currency: 'cad',
//     payment_method_types: ['card'],
//     receipt_email: 'jenny.rosen@example.com',
//   });

//   res.json(paymentIntent)
// })

app.get('/products', async (req, res) => {
  const products = await stripe.products.list()
  res.json(products)
})

app.get('/prices', async (req, res) => {
  const prices = await stripe.prices.list()
  res.json(prices)
})

app.post('/create-customer', async (req, res) => {
  const customer = await stripe.customers.create({
    email: req.body.email
  });

  res.json(customer)
})

app.post('/create-subscription', async (req, res) => {
  // Attach the payment method to the customer
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
  } catch (error) {
    return res.status('402').send({ error: { message: error.message } });
  }

  // Change the default invoice settings on the customer to the new payment method
  await stripe.customers.update(
    req.body.customerId,
    {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
    }
  );

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: req.body.customerId,
    items: [{ price: req.body.priceId }],
    expand: ['latest_invoice.payment_intent'],
  });

  res.json(subscription);
});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})
