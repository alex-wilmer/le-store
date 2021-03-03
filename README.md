# le store

### a simple stripe gateway (for product subscriptions)

- [Stripe "Fixed Price" Subscriptions](https://stripe.com/docs/billing/subscriptions/fixed-price)
- [React Stripe](https://stripe.com/docs/stripe-js/react)
- [Playwright](https://playwright.dev/)

Roadmap:

- [Pay Now Button](https://stripe.com/docs/stripe-js/elements/payment-request-button)

### Get Started

#### Setup Environment

```
# api/.env
# stripe secret key
STRIPE_SECRET=
```

```
# ui/.env
# api uri (defaults to http://localhost:5555)
REACT_APP_API=
```

### Install, Run, Test

```
yarn
yarn workspace api start
yarn workspace ui start
yarn workspace test test
```

Example test output:

```
~/Projects/le-store/test⚡️yarn test
yarn run v1.22.5
$ jest
 PASS   browser: chromium  ./main.test.js (16.061 s)
  ✓ should display the product (329 ms)
  ✓ should create a stripe subscription (6065 ms)
```
