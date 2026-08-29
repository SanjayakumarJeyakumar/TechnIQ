export async function getAIGuidance(skills, prompt, accessToken) {
  const response = await fetch('/api/ai/guide', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ skills, prompt }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || 'Failed to get AI guidance')
  }

  const data = await response.json()
  return data.guidance
}
