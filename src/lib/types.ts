export interface Card {
  id: string
  name: string
  owner: string
  min_payment: number
  start_balance: number
  balance: number
  apr: number
  apr_known: boolean
  sort_order: number
}

export interface Payment {
  id: string
  card_id: string
  amount: number
  paid_on: string
  logged_by: string | null
  created_at: string
}

export interface PlanResult {
  months: number
  interest: number
  budget: number
  targetId: string | null
  thisMonth: Record<string, number>
  paidOffMonth: Record<string, number>
  series: number[]
}
