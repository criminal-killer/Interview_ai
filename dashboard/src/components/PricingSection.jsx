import { Check, Zap, Crown, Building } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out',
    features: [
      '10 minutes per week',
      'Basic AI answers',
      '1 resume',
      'Works on 1 platform'
    ],
    icon: Zap,
    color: 'slate'
  },
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
      'Voice answers',
      'AI notes'
    ],
    icon: Zap,
    color: 'blue',
    popular: false
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
      'AI notes',
      'Screen reading',
      'Code solutions',
      'Priority support'
    ],
    icon: Crown,
    color: 'purple',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    period: 'user/month',
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
    annual: 399.99
  }
]

export default function PricingSection({ compact = false }) {
  if (compact) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Upgrade Your Plan</h3>
        <div className="space-y-3">
          {plans.filter(p => p.id !== 'free').slice(0, 2).map(plan => (
            <div key={plan.id} className="p-4 bg-dark rounded-lg border border-border hover:border-primary transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{plan.name}</span>
                <span className="text-primary font-bold">${plan.price}<span className="text-slate-400 text-xs">/{plan.period}</span></span>
              </div>
              <button className="w-full py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors">
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-4 text-center">Save 50% with annual billing</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-slate-400">Start free, upgrade when you need more</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative bg-card rounded-xl p-6 border transition-all ${
              plan.popular
                ? 'border-primary shadow-lg shadow-primary/20'
                : 'border-border hover:border-primary'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                Most Popular
              </div>
            )}

            <div className={`w-10 h-10 rounded-lg mb-4 flex items-center justify-center ${
              plan.color === 'slate' ? 'bg-slate-600' :
              plan.color === 'blue' ? 'bg-blue-600' :
              plan.color === 'purple' ? 'bg-purple-600' :
              'bg-amber-600'
            }`}>
              <plan.icon className="w-5 h-5 text-white" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
            <p className="text-sm text-slate-400 mb-4">{plan.description}</p>

            <div className="mb-6">
              <span className="text-3xl font-bold text-white">${plan.price}</span>
              <span className="text-slate-400">/{plan.period}</span>
              {plan.annual && (
                <p className="text-xs text-green-500 mt-1">Save ${plan.annual - plan.price * 12}/year</p>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 rounded-lg font-medium transition-all ${
              plan.popular
                ? 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
                : 'bg-dark border border-border text-white hover:border-primary'
            }`}>
              Get Started
            </button>
          </div>
        ))}
      </div>

      {/* Annual Discount Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-6 border border-primary/30 text-center">
        <p className="text-white font-medium mb-2">Save up to 50% with annual billing</p>
        <p className="text-sm text-slate-400">Use code <span className="text-primary font-bold">INTERVIEW50</span> for extra savings</p>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-white mb-6 text-center">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              q: 'What happens when my weekly time runs out?',
              a: 'Your time resets every Monday. During the week, you can upgrade to continue using the service.'
            },
            {
              q: 'Can I switch plans anytime?',
              a: 'Yes! Upgrade or downgrade anytime. Changes take effect immediately.'
            },
            {
              q: 'Is my data private?',
              a: 'Absolutely. Your resumes and interview data are encrypted and never shared.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards, Paystack, and bank transfers.'
            }
          ].map((faq, i) => (
            <div key={i} className="bg-card rounded-lg p-6 border border-border">
              <h4 className="text-white font-medium mb-2">{faq.q}</h4>
              <p className="text-sm text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}