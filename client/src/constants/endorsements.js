/**
 * TechnIQ Canonical Peer Endorsement Tags
 * Predefined set of 8 structured recognition tags.
 */
export const ENDORSEMENT_TAGS = [
  {
    id: 'clear_explainer',
    label: 'Clear Explainer',
    icon: '💡',
    description: 'Breaks down complex concepts into simple, easy-to-grasp steps.',
  },
  {
    id: 'technical_expert',
    label: 'Technical Expert',
    icon: '🧠',
    description: 'Deep domain mastery and strong technical foundation.',
  },
  {
    id: 'patient_helpful',
    label: 'Patient & Helpful',
    icon: '🤝',
    description: 'Encouraging, patient pacing, and supportive approach.',
  },
  {
    id: 'great_debugger',
    label: 'Great Debugger',
    icon: '💻',
    description: 'Quickly identifies bugs, edge cases, and root causes.',
  },
  {
    id: 'problem_solver',
    label: 'Problem Solver',
    icon: '🎯',
    description: 'Finds clean, structured solutions to tricky challenges.',
  },
  {
    id: 'practical_guidance',
    label: 'Practical Guidance',
    icon: '🚀',
    description: 'Shares real-world best practices, tools, and workflows.',
  },
  {
    id: 'good_teacher',
    label: 'Good Teacher',
    icon: '📚',
    description: 'Structured explanations and excellent pedagogical intuition.',
  },
  {
    id: 'highly_recommended',
    label: 'Highly Recommended',
    icon: '⭐',
    description: 'Outstanding overall peer tutoring experience.',
  },
]

export const ENDORSEMENT_MAP = Object.fromEntries(
  ENDORSEMENT_TAGS.map((t) => [t.id, t])
)
