export type EffortLevel = 'low' | 'med' | 'high'

export interface UserProfile {
  primaryNiche: string
  interests: string[]
  preferredStyle?: string
  noFace: boolean
  effortLevel: EffortLevel
  preferredLengthSeconds: number
}

export default UserProfile
