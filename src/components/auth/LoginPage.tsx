'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, useAuthStore } from '@/lib/stores'
import { authApi, businessApi } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Menu, ArrowLeft } from 'lucide-react'

export function LoginPage() {
  const { setCurrentPage } = useAppStore()
  const { setUser, setBusinesses, setCurrentBusiness } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    setLoading(true)
    try {
      const result = await authApi.login(email, password)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      // Fetch profile and businesses
      const [profile, businesses] = await Promise.all([
        authApi.getProfile(),
        businessApi.list().catch(() => []),
      ])

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
        })
      }

      const bizList = businesses?.businesses || (Array.isArray(businesses) ? businesses : [])
      if (bizList.length > 0) {
        setBusinesses(bizList)
        setCurrentBusiness(bizList[0])
      }

      toast.success('Welcome back!')
      setCurrentPage('dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#1e1e3a] to-[#16162a] px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#e94560]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#e94560]/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to landing */}
        <button
          onClick={() => setCurrentPage('landing')}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </button>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-[#e94560]/15">
              <Menu className="h-6 w-6 text-[#e94560]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Welcome back
              </CardTitle>
              <CardDescription className="text-white/50 mt-1.5">
                Sign in to your MenuQR account
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#e94560]/50 focus:ring-[#e94560]/20"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/80 text-sm">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => toast.success('Password reset link sent to your email')}
                    className="text-xs text-[#e94560] hover:text-[#ff6b81] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#e94560]/50 focus:ring-[#e94560]/20"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#e94560] hover:bg-[#d13050] text-white font-semibold shadow-lg shadow-[#e94560]/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-sm text-white/40">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('register')}
                  className="text-[#e94560] hover:text-[#ff6b81] font-medium transition-colors"
                >
                  Create one
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-white/20 mt-6">
          &copy; {new Date().getFullYear()} ALTECH. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
