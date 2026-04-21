import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Phone, Loader2, GraduationCap } from 'lucide-react'

const Login: React.FC = () => {
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!mobile.trim()) {
      setError('Mobile number is required')
      return
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    try {
      await login(mobile.trim())
    } catch (err) {
      setError('Login failed. Please check your mobile number and try again.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #ecfdf5 70%, #f0f9ff 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: 'fixed', top: '-6rem', right: '-6rem', width: '20rem', height: '20rem',
          background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: '-6rem', left: '-6rem', width: '22rem', height: '22rem',
          background: 'radial-gradient(circle, rgba(21,128,61,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }}
      />

      <div className="w-full" style={{ maxWidth: '26rem', position: 'relative', zIndex: 1 }}>
        {/* Org header */}
        <div className="text-center mb-6">
          <div
            className="mx-auto mb-3 flex items-center justify-center"
            style={{
              width: '4rem', height: '4rem',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
            }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#14532d', marginBottom: '0.25rem' }}>
            SSF Kerala
          </h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>Career Counselor Portal</p>
        </div>

        <Card style={{ boxShadow: '0 8px 32px rgba(22,163,74,0.12)', border: '1px solid #bbf7d0' }}>
          <CardHeader className="text-center">
            <div
              className="mx-auto mb-3 flex items-center justify-center"
              style={{
                width: '3rem', height: '3rem',
                background: '#dcfce7',
                borderRadius: '9999px',
              }}
            >
              <Phone className="w-5 h-5" style={{ color: '#16a34a' }} />
            </div>
            <CardTitle style={{ fontSize: '1.25rem', justifyContent: 'center' }}>
              Counselor Login
            </CardTitle>
            <CardDescription>
              Enter your registered mobile number to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="mobile" className="text-sm font-medium" style={{ color: '#374151' }}>
                  Mobile Number
                </label>
                <div className="relative">
                  <span
                    style={{
                      position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      color: '#9ca3af', fontSize: '0.85rem', fontWeight: 500, pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    +91
                  </span>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setMobile(val)
                      if (error) setError('')
                    }}
                    style={{ paddingLeft: '3rem' }}
                    disabled={isLoading}
                    inputMode="numeric"
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div
                  className="text-sm"
                  style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    color: '#dc2626', borderRadius: '0.5rem', padding: '0.65rem 0.875rem',
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  }}
                >
                  <span style={{ marginTop: '1px' }}>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading} style={{ marginTop: '0.25rem' }}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-4 text-xs" style={{ color: '#9ca3af' }}>
          © 2026 Educine · SSF Keralam
        </p>
      </div>
    </div>
  )
}

export default Login
