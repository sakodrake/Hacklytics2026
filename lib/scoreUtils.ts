export function computeMatchScore(profile:any, trend:any){
  const explanation: string[] = []
  let score = 50
  const primary = profile?.primary_niche?.toString().toLowerCase()
  const secondaries = (profile?.secondary_niches || []).map((s:any)=> s.toString().toLowerCase())
  const text = ((trend?.caption||'') + ' ' + (trend?.title||'') + ' ' + ((trend?.hashtags||[]).join(' '))).toLowerCase()

  if(primary && text.includes(primary)){
    score += 30
    explanation.push(`Primary niche match: ${profile.primary_niche}`)
  }

  let secMatches = 0
  for(const s of secondaries){
    if(s && text.includes(s)){
      score += 5
      secMatches++
    }
  }
  if(secMatches) explanation.push(`${secMatches} secondary niche match(es)`) 

  const style = profile?.content_style?.toString().toLowerCase()
  if(style && text.includes(style)){
    score += 10
    explanation.push(`Content style matches (${profile.content_style})`)
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  return { score, explanation }
}

export function computeReplicability(profile:any, trend:any){
  const t = (trend?.title || '').toString().toLowerCase()
  const tags = trend?.hashtags || []
  let complexity = 1.5

  if(t.match(/\b(quick|easy|hack|simple|no equipment|no-equipment)\b/)) complexity -= 0.7
  if(t.match(/\b(challenge|complex|elaborate|cinematic)\b/)) complexity += 0.9
  if((tags||[]).length > 4) complexity += 0.4

  complexity = Math.max(0.2, complexity)
  let label = 'Medium'
  if(complexity <= 0.9) label = 'Easy'
  else if(complexity >= 2) label = 'Hard'

  const score = Math.max(0, Math.min(100, Math.round(100 - (complexity-0.5) * 30)))
  const reason = [`Hashtags: ${(tags||[]).slice(0,4).join(', ') || 'none'}`, `Estimated complexity factor: ${complexity.toFixed(2)}`]

  return { label, score, reason }
}
