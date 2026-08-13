'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, useAuthStore } from '@/lib/stores'
import { authApi } from '@/lib/api'
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
import { Loader2, Menu, ArrowLeft, Check } from 'lucide-react'

export function RegisterPage() {
  const { setCurrentPage } = useAppStore()
  const { setUser } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordValid = password.length >= 8
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const getPasswordStrength = () => {
    if (!password) return null
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = [
    'bg-gray-200',
    'bg-red-400',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-emerald-400',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    if (!passwordValid) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      })

      // Auto-login
      const result = await authApi.login(email.trim(), password)

      if (result?.error) {
        toast.success('Account created! Please sign in.')
        setCurrentPage('login')
        return
      }

      // Fetch profile
      try {
        const profile = await authApi.getProfile()
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
          })
        }
      } catch {
        // profile fetch failed but account created
      }

      toast.success('Account created successfully!')
      setCurrentPage('create-business')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength()

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#1e1e3a] to-[#16162a] px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[#e94560]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#e94560]/5 blur-3xl" />
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
                Create your account
              </CardTitle>
              <CardDescription className="text-white/50 mt-1.5">
                Start building your digital menu today
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80 text-sm">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#e94560]/50 focus:ring-[#e94560]/20"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>

              {/* Email */}
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#e94560]/50 focus:ring-[#e94560]/20"
                  autoComplete="new-password"
                  disabled={loading}
                />
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            strength !== null && strength > i
                              ? strengthColors[strength]
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/40">
                      {strength !== null && strength > 0
                        ? strengthLabels[strength]
                        : 'Enter a password'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80 text-sm">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#e94560]/50 focus:ring-[#e94560]/20 ${
                      confirmPassword.length > 0 && !passwordsMatch
                        ? 'border-red-500/50 focus:border-red-500/50'
                        : confirmPassword.length > 0 && passwordsMatch
                          ? 'border-emerald-500/50'
                          : ''
                    }`}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {confirmPassword.length > 0 && passwordsMatch && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  )}
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                disabled={loading || !passwordValid || !passwordsMatch}
                className="w-full h-11 bg-[#e94560] hover:bg-[#d13050] text-white font-semibold shadow-lg shadow-[#e94560]/25 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-sm text-white/40">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('login')}
                  className="text-[#e94560] hover:text-[#ff6b81] font-medium transition-colors"
                >
                  Sign in
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
