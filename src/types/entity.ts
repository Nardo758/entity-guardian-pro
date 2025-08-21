export interface Entity {
  id: number;
  name: string;
  type: 'sole_proprietorship' | 'partnership' | 'llc' | 'c_corp' | 's_corp';
  state: string;
  formationDate: string;
  registeredAgent: {
    name: string;
    email: string;
    phone: string;
    fee: number;
    feeDueDate?: string;
  };
  independentDirector: {
    name: string;
    email: string;
    phone: string;
    fee: number;
    feeDueDate?: string;
  };
}

export interface Payment {
  id: number;
  entityName: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'scheduled';
  paymentMethod: string | null;
  paidDate?: string;
}

export interface PaymentMethod {
  id: number;
  type: 'credit_card' | 'bank_account';
  name: string;
  isDefault: boolean;
  expiryDate?: string;
  routingNumber?: string;
}

export interface Notification {
  id: number;
  type: 'payment_due' | 'renewal_reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
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