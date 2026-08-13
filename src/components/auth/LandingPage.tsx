'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  ScanLine,
  Palette,
  MessageCircle,
  BarChart3,
  Building2,
  UserPlus,
  UtensilsCrossed,
  Share2,
  ArrowRight,
  Check,
  Zap,
  Star,
  Menu,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const features = [
  {
    icon: QrCode,
    title: 'QR Code Menus',
    description: 'Generate beautiful QR codes that link directly to your digital menu. No app download required for customers.',
  },
  {
    icon: ScanLine,
    title: 'AI Menu Scanner',
    description: 'Upload a photo of your printed menu and our AI will extract all items, prices, and categories automatically.',
  },
  {
    icon: Palette,
    title: 'Beautiful Templates',
    description: 'Choose from professionally designed templates. Customize colors, fonts, and layout to match your brand.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Ordering',
    description: 'Let customers place orders directly via WhatsApp. Seamless integration with your existing workflow.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track views, popular items, and customer behavior with detailed analytics and insights dashboards.',
  },
  {
    icon: Building2,
    title: 'Multi-Business Support',
    description: 'Manage multiple restaurants, cafes, or food businesses from a single account with unified analytics.',
  },
]

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your free account in seconds. No credit card required to get started.',
  },
  {
    icon: Building2,
    title: 'Create Business',
    description: 'Add your restaurant or food business details including logo and contact information.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Build Menu',
    description: 'Add items manually or use AI to scan your existing menu. Customize categories and prices.',
  },
  {
    icon: Share2,
    title: 'Share QR Code',
    description: 'Download and print your QR code. Place it on tables, windows, or flyers to go digital instantly.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with digital menus',
    features: [
      '1 Business',
      'Up to 20 menu items',
      'Basic QR code',
      '1 Template',
      'Standard analytics',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For growing restaurants that need more power',
    features: [
      '3 Businesses',
      'Unlimited menu items',
      'Custom branded QR codes',
      'All templates',
      'AI Menu Scanner',
      'WhatsApp ordering',
      'Advanced analytics',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$49',
    period: '/month',
    description: 'For chains and multi-location restaurants',
    features: [
      'Unlimited businesses',
      'Unlimited everything',
      'Custom domain',
      'Priority support',
      'Team collaboration',
      'API access',
      'White-label branding',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export function LandingPage() {
  const { setCurrentPage } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1a1a2e]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#e94560]">
                <Menu className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Menu<span className="text-[#e94560]">QR</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setCurrentPage('login')}
              >
                Sign In
              </Button>
              <Button
                className="bg-[#e94560] hover:bg-[#d13050] text-white font-semibold shadow-lg shadow-[#e94560]/25"
                onClick={() => setCurrentPage('register')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-[#1a1a2e] pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#e94560]/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#e94560]/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#e94560]/5 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-6 px-4 py-1.5 bg-[#e94560]/15 text-[#e94560] border-[#e94560]/20 hover:bg-[#e94560]/20">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Trusted by 2,000+ restaurants worldwide
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]"
            >
              Create Your Digital Menu
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#ff6b81]">
                in Minutes
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-white/60 leading-relaxed"
            >
              Transform your restaurant with beautiful QR code menus.
              No app downloads, no contact — customers scan and browse your menu instantly.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-[#e94560] hover:bg-[#d13050] text-white font-semibold shadow-xl shadow-[#e94560]/30 h-12 px-8 text-base"
                onClick={() => setCurrentPage('register')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-8 text-base"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                See How It Works
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-12 flex items-center justify-center gap-6 text-sm text-white/40"
            >
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#e94560]" />
                Free plan available
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#e94560]" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#e94560]" />
                Setup in 5 minutes
              </span>
            </motion.div>
          </motion.div>

          {/* Hero visual - mockup card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            className="mt-16 mx-auto max-w-4xl"
          >
            <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 shadow-2xl shadow-black/20">
              <div className="rounded-xl bg-gradient-to-br from-[#1e1e3a] to-[#2a2a4a] p-6 sm:p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-[#e94560]/20 flex items-center justify-center">
                    <UtensilsCrossed className="h-5 w-5 text-[#e94560]" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">La Bella Cucina</div>
                    <div className="text-white/50 text-sm">Italian Restaurant</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['Pasta Carbonara', 'Margherita Pizza', 'Tiramisu'].map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/5 border border-white/5 p-4"
                    >
                      <div className="h-20 rounded-md bg-white/5 mb-3 flex items-center justify-center">
                        <span className="text-white/20 text-3xl">
                          {['🍝', '🍕', '🍰'][i]}
                        </span>
                      </div>
                      <div className="text-white/90 text-sm font-medium">{item}</div>
                      <div className="text-[#e94560] text-sm font-semibold mt-1">
                        {['$14.99', '$12.99', '$8.99'][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 md:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-4 px-3 py-1">
                Features
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight"
            >
              Everything You Need to
              <br className="hidden sm:block" />
              {' '}Go Digital
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
            >
              Powerful tools to create, manage, and share your digital menu — all in one platform.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div key={feature.title} variants={fadeUp} custom={i}>
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e94560]/10">
                      <feature.icon className="h-6 w-6 text-[#e94560]" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-4 px-3 py-1">
                How It Works
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight"
            >
              Up and Running in 4 Simple Steps
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
            >
              From sign-up to sharing your QR code — it takes less than 5 minutes.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-[#e94560]/30 to-[#e94560]/10" />
                )}
                <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] shadow-lg mb-5">
                  <step.icon className="h-7 w-7 text-[#e94560]" />
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#e94560] text-white text-xs font-bold">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="py-20 md:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-4 px-3 py-1">
                Pricing
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight"
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
            >
              Start free and scale as your business grows. No hidden fees.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {plans.map((plan, i) => (
              <motion.div key={plan.name} variants={fadeUp} custom={i}>
                <Card
                  className={`relative h-full flex flex-col ${
                    plan.highlighted
                      ? 'border-[#e94560] shadow-xl shadow-[#e94560]/10 scale-[1.02]'
                      : 'border-gray-200 shadow-sm'
                  } bg-white`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#e94560] text-white px-3 py-1 shadow-md">
                        <Star className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-6">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    <div className="mt-4 flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-gray-400 text-sm">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4 pb-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-[#e94560] mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Button
                      className={`w-full h-11 font-semibold ${
                        plan.highlighted
                          ? 'bg-[#e94560] hover:bg-[#d13050] text-white shadow-lg shadow-[#e94560]/25'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                      onClick={() => setCurrentPage('register')}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-[#1a1a2e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            >
              Ready to Digitize Your Menu?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-4 text-lg text-white/50 max-w-xl mx-auto"
            >
              Join thousands of restaurants that have already made the switch.
              Start for free today.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8">
              <Button
                size="lg"
                className="bg-[#e94560] hover:bg-[#d13050] text-white font-semibold shadow-xl shadow-[#e94560]/30 h-12 px-8 text-base"
                onClick={() => setCurrentPage('register')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#12122a] border-t border-white/5 py-12 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#e94560]">
                <Menu className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Menu<span className="text-[#e94560]">QR</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
              <a href="#features" className="hover:text-white/70 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white/70 transition-colors">Pricing</a>
              <a href="#" className="hover:text-white/70 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white/70 transition-colors">Terms of Service</a>
            </div>
            <div className="text-sm text-white/30">
              &copy; {new Date().getFullYear()}{' '}
              <span className="font-semibold text-white/50">ALTECH</span>. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
