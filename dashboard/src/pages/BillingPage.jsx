import { useState } from 'react'
import { Check, Zap, Crown, Building, CreditCard, Clock, Plus } from 'lucide-react'

const PAYSTACK_LINKS = {
  starter: 'https://paystack.shop/pay/blinkora-starter',
  pro: 'https://paystack.shop/pay/blinkora-pro',
  enterprise: 'https://paystack.shop/pay/blinkora-enterprise'
}

// Time packs - pay as you go
const TIME_PACKS = [
  { id: 'time_10', name: '10 Minutes', price: 3, minutes: 10 },
  { id: 'time_30', name: '30 Minutes', price: 8, minutes: 30 },
  { id: 'time_60', name: '1 Hour', price: 15, minutes: 60 },
]

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19.99,
    period: 'month',
    description: 'For regular interviews',
    features: [
      '30 minutes per week',
      '5 resumes',
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
      '12 resumes',
      'All platforms',
      'Voice answers',
      'Screen reading',
      'Code solutions'
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
      'Unlimited resumes',
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-slate-400 mt-1">Manage your subscription and purchase time packs</p>
      </div>

      {/* Current Plan */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Current Plan</h3>
            <p className="text-slate-400 text-sm">
              {currentPlan === 'free' && '2 resumes, 10 min/week'}
              {currentPlan === 'starter' && '5 resumes, 30 min/week'}
              {currentPlan === 'pro' && '12 resumes, unlimited minutes'}
              {currentPlan === 'enterprise' && 'Unlimited everything'}
            </p>
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

      {/* Time Packs (Pay As You Go) */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-500" />
          Time Packs
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Buy extra interview time - no subscription required
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIME_PACKS.map(pack => (
            <div key={pack.id} className="bg-card rounded-xl p-6 border border-border text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-white font-semibold text-lg">{pack.name}</h3>
              <p className="text-3xl font-bold text-white mt-2">${pack.price}</p>
              <p className="text-slate-400 text-sm mt-1">one-time purchase</p>
              <a
                href={`https://paystack.shop/pay/blinkora-time-${pack.minutes}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Buy Now
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Subscription Plans</h2>
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

              {currentPlan === plan.id ? (
                <button disabled className="w-full py-3 bg-green-500/20 text-green-400 rounded-lg font-medium cursor-not-allowed">
                  Current Plan
                </button>
              ) : (
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
                  {currentPlan === 'free' || currentPlan === 'starter' || currentPlan === 'pro'
                    ? `Upgrade to ${plan.name}`
                    : `Switch to ${plan.name}`}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            { q: 'What happens when my weekly time runs out?', a: 'Upgrade to Pro for unlimited, or buy time packs.' },
            { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime. Your access continues until the billing period ends.' },
            { q: 'What are time packs?', a: 'One-time purchases of extra interview minutes. No subscription needed.' },
            { q: 'Is my data secure?', a: 'Yes, all data is encrypted and never shared.' }
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