const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const prisma = require('../prismaClient');
const { verifyToken } = require('../middleware/authMiddleware');
const { resolveTenant } = require('../middleware/tenantMiddleware');

// Create a checkout session (Protected endpoint for authenticated users)
router.post('/create-checkout-session', verifyToken, resolveTenant, async (req, res) => {
  try {
    const { feeId, studentId, amount, returnUrl } = req.body;
    const schoolId = req.tenant.id;

    if (!feeId || !studentId || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'School Fee Payment',
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl || process.env.VITE_API_URL}?payment=success&fee_id=${feeId}`,
      cancel_url: `${returnUrl || process.env.VITE_API_URL}?payment=cancelled`,
      metadata: {
        feeId,
        studentId,
        schoolId,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook endpoint to receive events from Stripe
// Note: This endpoint must receive the raw body to verify signatures.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For local testing without webhook secret
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { feeId, studentId, schoolId } = session.metadata;

    if (feeId && studentId && schoolId) {
      try {
        // Upsert fee payment record
        const payment = await prisma.feePayment.upsert({
          where: {
            studentId_feeId: {
              studentId,
              feeId
            }
          },
          update: {
            amount: session.amount_total / 100,
            status: 'Paid',
            paidDate: new Date(),
          },
          create: {
            studentId,
            feeId,
            schoolId,
            amount: session.amount_total / 100,
            status: 'Paid',
            paidDate: new Date(),
          }
        });
        console.log(`Payment successful for Fee ${feeId}, Student ${studentId}`);
      } catch (dbErr) {
        console.error('Error updating payment record in DB:', dbErr);
      }
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

module.exports = router;
