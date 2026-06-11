import { useState } from 'react'
import { Link } from 'react-router-dom'
import { trackEvent } from '../lib/analytics'

const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim()
const FEEDBACK_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL?.trim()

type Category = 'bug' | 'idea' | 'other'

const CATEGORY_LABEL: Record<Category, string> = {
  bug: 'Bug report',
  idea: 'Idea',
  other: 'Other',
}

export function Feedback() {
  const [category, setCategory] = useState<Category>('idea')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ACCESS_KEY) return
    if (!message.trim()) {
      setError('Please enter a message.')
      return
    }

    setStatus('sending')
    setError(null)

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `F1 Champion — ${CATEGORY_LABEL[category]}`,
          email: email.trim() || undefined,
          message: message.trim(),
          category: CATEGORY_LABEL[category],
          page: window.location.href,
          botcheck: '',
        }),
      })

      const data = (await res.json()) as { success?: boolean; message?: string }
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? 'Could not send feedback')
      }

      trackEvent('feedback_sent', { category })
      setStatus('sent')
      setMessage('')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="py-12 max-w-xl">
      <p className="np-label mb-3">Letters to the editor</p>
      <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight mb-4 text-ink border-b-4 border-ink pb-4">
        Send feedback
      </h1>
      <p className="text-muted text-sm mb-8 leading-relaxed">
        Bug reports, balance ideas, or anything about the game — every note is read.
      </p>

      {!ACCESS_KEY ? (
        <div className="np-panel border border-ink">
          <p className="text-sm text-muted mb-4">
            The feedback form is not configured on this build yet.
          </p>
          {FEEDBACK_EMAIL ? (
            <a href={`mailto:${FEEDBACK_EMAIL}`} className="np-btn-primary inline-flex np-focus">
              Email us
            </a>
          ) : (
            <Link to="/" className="np-btn-secondary inline-flex np-focus">
              Back home
            </Link>
          )}
        </div>
      ) : status === 'sent' ? (
        <div className="np-panel border border-ink">
          <p className="font-serif text-xl font-bold text-foreground mb-2">Thank you</p>
          <p className="text-sm text-muted mb-6">
            Your message was sent. If you left an email, we may reply when we can.
          </p>
          <Link to="/" className="np-btn-primary inline-flex np-focus">
            Back to the paper
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-ink divide-y divide-ink">
          <div className="p-6 sm:p-8 space-y-4">
            <fieldset>
              <legend className="np-label mb-3">Category</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['bug', 'Bug'],
                    ['idea', 'Idea'],
                    ['other', 'Other'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={
                      category === value
                        ? 'np-btn-primary min-h-10 px-4 np-focus'
                        : 'np-btn-secondary min-h-10 px-4 np-focus'
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="feedback-email" className="np-label block mb-2">
                Email (optional)
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="np-input np-focus"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="feedback-message" className="np-label block mb-2">
                Message
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="What happened? What would you like to see?"
                className="np-input min-h-[10rem] resize-y np-focus font-body"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm font-mono" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="p-6 sm:p-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="np-btn-primary np-focus disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            <Link to="/" className="np-btn-ghost np-focus">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
