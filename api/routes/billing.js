// Billing routes - Paystack integration with Clerk auth
const crypto = require('crypto');
const { usersStore } = require('../store');

// Paystack keys
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY;

const plans = {
  starter: { monthly: 19.99, yearly: 149.99 },
  pro: { monthly: 34.99, yearly: 299.99 },
  enterprise: { monthly: 49.99, yearly: 399.99 }
};

// Find user by Clerk ID
function findUserByClerkId(clerkUserId) {
  if (!clerkUserId) return null;
  for (const [email, user] of usersStore) {
    if (user.id === clerkUserId) {
      return user;
    }
  }
  return null;
}

module.exports = {
  // Create checkout session
  createCheckout: async (req, res) => {
    try {
      const clerkUserId = req.headers['x-clerk-user-id'];
      const user = findUserByClerkId(clerkUserId);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { plan, interval } = req.body;

      if (!plans[plan]) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      const amount = plans[plan][interval] * 100; // Convert to kobo
      const email = user.email;

      // Create Paystack transaction
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount,
          currency: 'USD',
          metadata: {
            userId: user.id,
            plan,
            interval,
            userEmail: email
          },
          callback_url: `${process.env.FRONTEND_URL || 'https://blinkora-plum.vercel.app'}/billing/callback`
        })
      });

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || 'Paystack error');
      }

      res.json({
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference
      });
    } catch (error) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout' });
    }
  },

  // Paystack webhook
  webhook: async (req, res) => {
    try {
      // Verify webhook signature
      const signature = req.headers['x-paystack-signature'];
      const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== signature) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;

      if (event.event === 'charge.success') {
        const { metadata } = event.data;

        // Update user subscription
        for (const [email, user] of usersStore) {
          if (user.id === metadata.userId) {
            user.plan = metadata.plan;
            user.subscriptionRef = metadata.reference;

            // Grant referral bonus to referrer
            if (user.referredBy) {
              for (const [refEmail, refUser] of usersStore) {
                if (refUser.id === user.referredBy) {
                  refUser.referralEarnings = (refUser.referralEarnings || 0) + 5;
                  break;
                }
              }
            }
            break;
          }
        }

        console.log(`Subscription activated: ${metadata.plan} for user ${metadata.userId}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  // Get plans
  getPlans: async (req, res) => {
    res.json({
      plans: [
        { id: 'free', name: 'Free', price: 0, features: ['10 min/week', 'Basic answers'] },
        { id: 'starter', name: 'Starter', monthly: 19.99, yearly: 149.99, features: ['30 min/week', 'All platforms', 'Voice answers'] },
        { id: 'pro', name: 'Pro', monthly: 34.99, yearly: 299.99, features: ['Unlimited', 'Code solutions', 'Priority support'] },
        { id: 'enterprise', name: 'Enterprise', monthly: 49.99, features: ['Everything in Pro', 'Team dashboard', 'API access'] }
      ]
    });
  }
};
