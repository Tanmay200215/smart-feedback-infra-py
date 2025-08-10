import { useEffect, useMemo, useState } from 'react'
import { Container, Grid, Paper, Typography, Box } from '@mui/material'
import { getInsights } from '../api'
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

const LIGHT_BLUE = '#93c5fd'       // bar color
const GREEN = '#22c55e'            // positive
const RED = '#ef4444'              // negative
const BLUE = '#3b82f6'             // neutral
const PRODUCTS = ['RO', 'RO+UV', 'RO+UV+Copper']

export default function Dashboard() {
  const [insights, setInsights] = useState({
    counts: { RO: 0, 'RO+UV': 0, 'RO+UV+Copper': 0 },
    sentiments: {
      RO: { positive: 0, negative: 0, neutral: 0 },
      'RO+UV': { positive: 0, negative: 0, neutral: 0 },
      'RO+UV+Copper': { positive: 0, negative: 0, neutral: 0 },
    },
    summaries: { RO: '', 'RO+UV': '', 'RO+UV+Copper': '' },
    suggestions: { RO: '', 'RO+UV': '', 'RO+UV+Copper': '' },
    timeseries: [],      // [{ day, product, count }]
    topics: []           // [{ text, value }]
  })

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getInsights()
        setInsights(prev => ({ ...prev, ...data }))
      } catch (e) {
        console.error('Failed to load insights', e)
      }
    })()
  }, [])

  const barData = useMemo(() => (
    PRODUCTS.map(p => ({ product: p, count: insights.counts?.[p] || 0 }))
  ), [insights])

  const lineData = useMemo(() => {
    const map = {}
    for (const row of insights.timeseries || []) {
      map[row.day] ||= { day: row.day, RO: 0, 'RO+UV': 0, 'RO+UV+Copper': 0 }
      map[row.day][row.product] = row.count
    }
    return Object.values(map)
  }, [insights])

  const pies = useMemo(() => {
    const s = insights.sentiments || {}
    const make = (p) => ([
      { name: 'Positive', value: s[p]?.positive || 0, fill: GREEN },
      { name: 'Negative', value: s[p]?.negative || 0, fill: RED },
      { name: 'Neutral',  value: s[p]?.neutral  || 0, fill: BLUE },
    ])
    return Object.fromEntries(PRODUCTS.map(p => [p, make(p)]))
  }, [insights])

  return (
    <Container sx={{ py: 4, mx:"auto" }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Dashboard</Typography>

      <Grid container spacing={3}sx={{ minHeight: "100%" }}>
        {/* Bar chart: Feedback count by product (light blue) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Feedback Count by Product</Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={LIGHT_BLUE} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Three pie charts: Positive/Negative/Neutral per product */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Sentiment by Product</Typography>
            <Grid container spacing={5}>
              {PRODUCTS.map(p => (
                <Grid key={p} item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', height: 320 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>{p}</Typography>
                    <ResponsiveContainer width="120%" height="85%">
                      <PieChart>
                        <Pie data={pies[p]} dataKey="value" nameKey="name" outerRadius={70} label />
                        <Legend />
                        <Tooltip />
                        {pies[p].map((slice, i) => <Cell key={i} fill={slice.fill} />)}
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Daily trend line chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Daily Submissions (by product)</Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="RO" />
                  <Line type="monotone" dataKey="RO+UV" />
                  <Line type="monotone" dataKey="RO+UV+Copper" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Topics tag-wall (word cloud style) */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top Topics</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 , height:320}}>
              {(insights.topics || []).map(t => (
                <Box
                  key={t.text}
                  sx={{
                    px: 1.5, py: 0.6, borderRadius: 5,
                    bgcolor: 'rgba(4,102,200,0.08)', color: '#075985',
                    fontSize: Math.min(18, 12 + (t.value || 1) / 3)
                  }}
                >
                  #{t.text}
                </Box>
              ))}
              {(insights.topics || []).length === 0 && (
                <Typography variant="body2" color="text.secondary">No topics yet.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sentiment summaries + actionable suggestions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Sentiment Summary & Suggestions</Typography>
            <Grid container spacing={13}>
              {PRODUCTS.map(p => (
                <Grid item xs={12} md={4} key={p}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(4,102,200,0.05)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{p}</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {insights.summaries?.[p] || 'No data yet.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1.5, fontSize: 14 }}>
                      <span style={{ color: GREEN }}>● Positive: {insights.sentiments?.[p]?.positive ?? 0}</span>
                      <span style={{ color: RED }}>● Negative: {insights.sentiments?.[p]?.negative ?? 0}</span>
                      <span style={{ color: BLUE }}>● Neutral: {insights.sentiments?.[p]?.neutral ?? 0}</span>
                    </Box>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      Suggestion: {insights.suggestions?.[p] || '—'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
