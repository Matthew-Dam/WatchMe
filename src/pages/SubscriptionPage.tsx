import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Check, X, Crown, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface Plan {
  id: string
  name: string
  price: number
  max_profiles: number
  quality: string
  ads: boolean
}

interface CurrentSubscription {
  plan: string
  status: string
  start_date: string
  end_date: string | null
}

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [current, setCurrent] = useState<CurrentSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch('/api/subscriptions/plans'),
          fetch('/api/subscriptions/my'),
        ])
        if (plansRes.ok) setPlans(await plansRes.json())
        if (subRes.ok) setCurrent(await subRes.json())
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleChangePlan(planId: string) {
    setChanging(true)
    try {
      const res = await fetch('/api/subscriptions/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to change plan')
      }
      const data = await res.json()
      setCurrent(data)
      toast.success(`Switched to ${planId} plan!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Plan change failed')
    } finally {
      setChanging(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" variant="cyan" />
      </div>
    )
  }

  const currentPlan = current?.plan || 'free'

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-12">
          <Crown size={40} className="text-cyan mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white">Choose Your Plan</h1>
          <p className="text-gray-400 mt-2">Upgrade or change your subscription anytime</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                className={`glass rounded-2xl p-6 flex flex-col relative transition-all duration-300 ${
                  isCurrent ? 'border-cyan/50 ring-1 ring-cyan/30' : 'hover:border-cyan/20'
                } ${plan.id === 'premium' ? 'scale-105 sm:scale-110' : ''}`}
              >
                {plan.id === 'premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="cyan" className="text-[10px] uppercase tracking-wider">Most Popular</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-3">
                    <Badge variant="lime" className="text-[10px] uppercase tracking-wider">Current</Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-heading font-bold text-white">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-heading font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400 text-sm">/mo</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    {plan.max_profiles > 0 ? <Check size={14} className="text-lime shrink-0" /> : <X size={14} className="text-gray-500 shrink-0" />}
                    <span className="text-gray-300">{plan.max_profiles} profile{plan.max_profiles > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-lime shrink-0" />
                    <span className="text-gray-300">{plan.quality} quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.ads ? <X size={14} className="text-magenta shrink-0" /> : <Check size={14} className="text-lime shrink-0" />}
                    <span className="text-gray-300">{plan.ads ? 'Ads' : 'Ad-free'}</span>
                  </div>
                </div>

                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  className="w-full mt-6"
                  onClick={() => handleChangePlan(plan.id)}
                  disabled={isCurrent || changing}
                  isLoading={changing}
                >
                  {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade to Free' : 'Subscribe'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
