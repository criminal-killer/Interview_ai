import { Check, Zap, Crown, Building, CreditCard } from 'lucide-react'

const PAYSTACK_LINKS = {
  starter: 'https://paystack.shop/pay/blinkora-starter',
  pro: 'https://paystack.shop/pay/blinkora-pro',
  enterprise: 'https://paystack.shop/pay/blinkora-enterprise'
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19.99,
    period: 'month',
    description: 'For regular interviews',
    features: [
      '30 minutes per week',
      'All AI models',
      'Unlimited resumes',
      'All platforms',
      'Voice answers'
    ],
    icon: Zap,
    color: 'blue',
    colorClass: 'border-blue-500 shadow-blue-500/20'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 34.99,
    period: 'month',
    description: 'For serious job seekers',
    features: [
      'Unlimited minutes',
      'All AI models',
      'Unlimited resumes',
      'All platforms',
      'Voice answers',
      'Screen reading',
      'Code solutions',
      'Priority support'
    ],
    icon: Crown,
    color: 'purple',
    colorClass: 'border-primary shadow-primary/20',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    period: 'month',
    description: 'For teams',
    features: [
      'Everything in Pro',
      'Team dashboard',
      'Analytics',
      'API access',
      'SSO',
      'Dedicated support'
    ],
    icon: Building,
    color: 'amber',
    colorClass: 'border-amber-500 shadow-amber-500/20'
  }
]

export default function BillingPage({ userData }) {
  const currentPlan = userData?.plan || 'free'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-slate-400 mt-1">Manage your subscription and upgrade your plan</p>
      </div>

      {/* Current Plan */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Current Plan</h3>
            <p className="text-slate-400 text-sm">You are on the {currentPlan} plan</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium text-white bg-${
            currentPlan === 'free' ? 'slate-600' :
            currentPlan === 'starter' ? 'blue-600' :
            currentPlan === 'pro' ? 'purple-600' : 'amber-600'
          }`}>
            <span className="capitalize">{currentPlan}</span>
          </div>
        </div>
      </div>

      {/* Upgrade Plans */}
      {currentPlan === 'free' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Upgrade Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`relative bg-card rounded-xl p-6 border-2 transition-all ${plan.colorClass}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-10 h-10 rounded-lg mb-4 flex items-center justify-center bg-${plan.color}-600`}>
                  <plan.icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-slate-400">/{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={PAYSTACK_LINKS[plan.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-3 rounded-lg font-medium text-center transition-colors ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
                      : 'bg-dark border border-border text-white hover:border-primary'
                  }`}
                >
                  Choose {plan.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already Subscribed */}
      {currentPlan !== 'free' && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Manage Subscription</h3>
          <p className="text-slate-400 mb-4">
            To upgrade, downgrade, or cancel your subscription, please contact support.
          </p>
          <div className="flex gap-4">
            <a
              href={PAYSTACK_LINKS.pro}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Upgrade to Pro
            </a>
            <a
              href="mailto:support@blinkora.com"
              className="px-6 py-3 bg-border text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            {
              q: 'What happens when my weekly time runs out?',
              a: 'Your time resets every Monday. Upgrade to Pro for unlimited access.'
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes, you can cancel anytime. Your access continues until the end of your billing period.'
            },
            {
              q: 'Is my data secure?',
              a: 'Absolutely. Your data is encrypted and never shared with third parties.'
            }
          ].map((faq, i) => (
            <div key={i} className="p-4 bg-dark rounded-lg">
              <h4 className="text-white font-medium mb-1">{faq.q}</h4>
              <p className="text-sm text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
