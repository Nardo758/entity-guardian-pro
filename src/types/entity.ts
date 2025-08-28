export interface Entity {
  id: string;
  user_id: string;
  name: string;
  type: 'sole_proprietorship' | 'partnership' | 'llc' | 'c_corp' | 's_corp';
  state: string;
  formation_date: string;
  registered_agent_name: string;
  registered_agent_email: string;
  registered_agent_phone: string;
  registered_agent_fee: number;
  registered_agent_fee_due_date?: string;
  independent_director_name?: string;
  independent_director_email?: string;
  independent_director_phone?: string;
  independent_director_fee?: number;
  independent_director_fee_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  entity_name: string;
  type: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'scheduled';
  payment_method: string | null;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'credit_card' | 'bank_account';
  name: string;
  is_default: boolean;
  expiry_date?: string;
  routing_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'payment_due' | 'renewal_reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  subscription: {
    status: string;
    billingCycle: string;
    nextBilling: string;
    amount: number;
  };
}