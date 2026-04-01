const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { amount, mode } = JSON.parse(event.body);

    // Validate amount
    if (!amount || isNaN(amount) || amount < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid amount' })
      };
    }

    // Amount must be in cents for Stripe
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Build the line item — works for both one-time and recurring
    const lineItem = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Natalie Sorensen — Oxford Cancer Research Fund',
          description: `Your donation funds ${(amount / 178).toFixed(1)} days of Oxford cancer research`,
        },
        unit_amount: amountInCents,
        // Add recurring interval if monthly mode
        ...(mode === 'monthly' && {
          recurring: { interval: 'month' }
        }),
      },
      quantity: 1,
    };

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: mode === 'monthly' ? 'subscription' : 'payment',
      success_url: 'https://fundnatalie.github.io/thankyou.html',
      cancel_url: 'https://fundnatalie.github.io/',
      // Allow promo codes if you ever want to add them
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
{
  "name": "fundnatalie",
  "version": "1.0.0",
  "description": "Natalie Sorensen Oxford fundraising site",
  "dependencies": {
    "stripe": "^14.0.0"
  }
}
