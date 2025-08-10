import { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography } from '@mui/material'
import { postFeedback } from '../api'

export default function FeedbackDialog({ open, onClose, product }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  // Prefill from sessionStorage
  useEffect(() => {
    if (open) {
      const last = sessionStorage.getItem('fc:lastSubmission')
      if (last) {
        try {
          const obj = JSON.parse(last)
          setName(obj.name || '')
          setEmail(obj.email || '')
          setMessage('')
        } catch {}
      }
    }
  }, [open])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = { product, name, email, message }
      const { data } = await postFeedback(payload)
      setSubmitted(data)
      // Save useful bits to sessionStorage
      sessionStorage.setItem('fc:lastSelectedProduct', product)
      sessionStorage.setItem('fc:lastSubmission', JSON.stringify({ name, email, when: new Date().toISOString() }))
    } catch (e) {
      alert(e?.response?.data?.detail || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Feedback — {product}</DialogTitle>
      <DialogContent dividers>
        {submitted ? (
          <Box>
            <Typography variant="h6" gutterBottom>Thanks, {submitted.name}!</Typography>
            <Typography variant="body2">Your feedback for <b>{submitted.product}</b> was recorded.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} required />
            <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <TextField label="Message" value={message} onChange={e => setMessage(e.target.value)} multiline minRows={3} required />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!submitted ? (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>Submit</Button>
          </>
        ) : (
          <Button variant="contained" onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
