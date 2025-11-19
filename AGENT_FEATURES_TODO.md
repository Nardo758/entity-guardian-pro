# 📋 Agent Features Todo List

**Last Updated:** 2025-11-19  
**Status:** Planning Phase

---

## 🎯 Core Agent Features

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Create agents table with RLS policies
- [x] Add agent signup flow
- [x] Store agent profile data (company, states, pricing, bio)
- [x] User type selection (entity owner vs agent)

---

### 🚧 Phase 2: Agent Profile Management (NEXT UP)

#### Task 1: Agent Profile Editing
**Priority:** High  
**Time Estimate:** 30 minutes

Features:
- [ ] Add "Agent Profile" tab in Settings page
- [ ] Profile edit form with validation
- [ ] Update company name, bio, years of experience
- [ ] Manage service states (multi-select)
- [ ] Set pricing per entity
- [ ] Toggle availability status
- [ ] Save changes with loading states

**Files to Create/Modify:**
- Create: `src/components/settings/AgentProfileEditor.tsx`
- Modify: `src/pages/Settings.tsx` (add new tab)

---

#### Task 2: Agent Dashboard
**Priority:** High  
**Time Estimate:** 45 minutes

Features:
- [ ] Overview of agent metrics
- [ ] Active assignments count
- [ ] Revenue tracking
- [ ] Recent invitations
- [ ] Entity portfolio view
- [ ] Quick actions (update availability, view directory)

**Files to Create:**
- `src/pages/AgentDashboard.tsx` (already exists, enhance it)
- `src/components/AgentMetricsCard.tsx`
- `src/components/AgentRecentActivity.tsx`

---

### 🔄 Phase 3: Agent Discovery & Directory

#### Task 3: Agent Directory Browser
**Priority:** High  
**Time Estimate:** 1 hour  
**Status:** ✅ COMPLETED

Features:
- [x] Public directory of available agents
- [x] Filter by state
- [x] Filter by price range (slider)
- [x] Filter by experience level (slider)
- [x] Search by company name, keywords, location
- [x] Sort by price, experience, availability
- [x] Agent profile cards with key info
- [x] Click to view detailed profile modal
- [x] "Invite Agent" button for entity owners
- [x] Stats overview (total agents, available, avg fee)
- [x] Empty state with clear filters option

**Files Created:**
- `src/pages/AgentDirectory.tsx` (completely rebuilt)
- `src/components/AgentDirectoryCard.tsx`

**Backend:**
- `src/hooks/useAgents.ts` (uses existing fetchAgentsDirectory)

---

#### Task 4: Agent Search & Matching
**Priority:** Medium  
**Time Estimate:** 30 minutes

Features:
- [ ] Search agents by name or company
- [ ] Smart matching based on entity state
- [ ] Recommended agents for entity owners
- [ ] Save favorite agents
- [ ] Agent comparison tool

**Files to Create:**
- `src/components/AgentSearch.tsx`
- `src/components/AgentRecommendations.tsx`
- `src/hooks/useAgentSearch.ts`

---

### 📨 Phase 4: Agent Invitation System

#### Task 5: Send Agent Invitations
**Priority:** High  
**Time Estimate:** 45 minutes  
**Status:** ✅ COMPLETED

Features:
- [x] Invite agent to manage specific entity
- [x] Include custom message
- [x] Send email notification
- [x] Track invitation status (pending/accepted/declined)
- [x] Resend invitation option (via unsend)
- [x] Cancel pending invitation

**Files Created:**
- Database: `agent_invitations` table with RLS policies
- Database: `entity_agent_assignments` table with RLS policies
- Edge Function: `supabase/functions/send-agent-invitation/index.ts`
- Hook: `src/hooks/useAgentInvitations.ts` (enhanced with email sending)
- Component: `src/components/InviteAgentForm.tsx` (already existed)

**Backend:**
- [x] Create `agent_invitations` table
- [x] Add RLS policies
- [x] Create invitation email notification system
- [x] Auto-create assignments on acceptance

---

#### Task 6: Agent Invitation Management
**Priority:** High  
**Time Estimate:** 30 minutes  
**Status:** ✅ COMPLETED

Features:
- [x] View received invitations
- [x] Accept/decline invitations
- [x] View invitation details (entity, fees)
- [x] Notification badge for new invitations
- [x] Invitation history

**Files Created:**
- `src/components/InvitationCard.tsx`
- `src/pages/AgentInvitations.tsx`

---

#### Task 7: Entity-Agent Assignments
**Priority:** High  
**Time Estimate:** 30 minutes

Features:
- [ ] Track active agent assignments
- [ ] View assigned entities (agent view)
- [ ] View assigned agent (entity owner view)
- [ ] Terminate assignment
- [ ] Assignment history
- [ ] Fee tracking per assignment

**Database:**
- [ ] Create `entity_agent_assignments` table
- [ ] Add RLS policies
- [ ] Track assignment dates and fees

**Files to Create:**
- `src/components/AgentAssignmentsList.tsx`
- `src/hooks/useAgentAssignments.ts`

---

### 💰 Phase 5: Financial Features

#### Task 8: Agent Fee Tracking
**Priority:** Medium  
**Time Estimate:** 45 minutes

Features:
- [ ] Dashboard showing total fees earned
- [ ] Fee breakdown by entity
- [ ] Monthly/yearly revenue charts
- [ ] Pending vs paid fees
- [ ] Export fee reports

**Files to Create:**
- `src/components/AgentFinancialDashboard.tsx`
- `src/components/charts/AgentRevenueChart.tsx`
- `src/hooks/useAgentFinancials.ts`

---

#### Task 9: Payment Integration for Agent Fees
**Priority:** Low  
**Time Estimate:** 2 hours

Features:
- [ ] Entity owners pay agent fees through app
- [ ] Stripe integration for agent payouts
- [ ] Fee payment history
- [ ] Automatic fee calculation
- [ ] Payment reminders

**Database:**
- [ ] Create `agent_fee_payments` table
- [ ] Track payment status

---

### 🔔 Phase 6: Notifications & Communication

#### Task 10: Agent Notifications
**Priority:** Medium  
**Time Estimate:** 30 minutes

Features:
- [ ] New invitation notifications
- [ ] Assignment status updates
- [ ] Entity renewal reminders
- [ ] Payment received notifications
- [ ] In-app notification center

**Files to Modify:**
- `src/hooks/useAgentNotifications.ts` (already exists)
- `src/components/AgentNotificationCenter.tsx`

---

#### Task 11: Messaging System
**Priority:** Low  
**Time Estimate:** 2 hours

Features:
- [ ] Direct messaging between entity owners and agents
- [ ] Message threads per entity
- [ ] File sharing (documents)
- [ ] Read receipts
- [ ] Email notifications for new messages

**Database:**
- [ ] Create `messages` table
- [ ] Create `message_threads` table

---

### 📊 Phase 7: Analytics & Reporting

#### Task 12: Agent Analytics
**Priority:** Low  
**Time Estimate:** 1 hour

Features:
- [ ] Client acquisition metrics
- [ ] Response time tracking
- [ ] Satisfaction ratings
- [ ] Service completion rates
- [ ] Revenue trends

**Files to Create:**
- `src/components/AgentAnalyticsDashboard.tsx`
- `src/hooks/useAgentAnalytics.ts`

---

#### Task 13: Rating & Review System
**Priority:** Low  
**Time Estimate:** 1 hour

Features:
- [ ] Entity owners rate agents
- [ ] Review system with comments
- [ ] Display ratings in directory
- [ ] Average rating calculation
- [ ] Response to reviews

**Database:**
- [ ] Create `agent_reviews` table
- [ ] Add rating column to agents table

---

## 📈 Progress Summary

| Phase | Status | Tasks | Completed | Progress |
|-------|--------|-------|-----------|----------|
| Phase 1: Foundation | ✅ Completed | 4 | 4 | 100% |
| Phase 2: Profile Management | 🔜 Next | 2 | 0 | 0% |
| Phase 3: Discovery | ✅ Completed | 2 | 2 | 100% |
| Phase 4: Invitations | ✅ Completed | 3 | 3 | 100% |
| Phase 5: Financials | ⏳ Planned | 2 | 0 | 0% |
| Phase 6: Communications | ⏳ Planned | 2 | 0 | 0% |
| Phase 7: Analytics | ⏳ Planned | 2 | 0 | 0% |

**Total:** 17 tasks | 9 completed | 8 remaining

---

## 🎯 Recommended Implementation Order

1. **Week 1: Core Setup**
   - Task 1: Agent Profile Editing
   - Task 2: Agent Dashboard
   - Task 5: Send Agent Invitations

2. **Week 2: Discovery & Matching**
   - Task 3: Agent Directory Browser
   - Task 6: Agent Invitation Management
   - Task 7: Entity-Agent Assignments

3. **Week 3: Enhanced Features**
   - Task 4: Agent Search & Matching
   - Task 10: Agent Notifications
   - Task 8: Agent Fee Tracking

4. **Week 4: Advanced Features** (Optional)
   - Task 9: Payment Integration
   - Task 11: Messaging System
   - Task 12: Agent Analytics
   - Task 13: Rating & Review System

---

## 📝 Technical Notes

### Database Tables Needed
- [x] `agents` - Agent profiles
- [ ] `agent_invitations` - Invitation tracking
- [ ] `entity_agent_assignments` - Active assignments
- [ ] `agent_fee_payments` - Payment tracking
- [ ] `messages` - Messaging system
- [ ] `message_threads` - Message organization
- [ ] `agent_reviews` - Rating system

### Edge Functions Needed
- [ ] `send-agent-invitation` - Email notifications
- [ ] `process-agent-payment` - Fee payments
- [ ] `calculate-agent-metrics` - Analytics

### Key Hooks to Create
- [x] `useAgents.ts`
- [x] `useAgentInvitations.ts`
- [x] `useAgentNotifications.ts`
- [ ] `useAgentAssignments.ts`
- [ ] `useAgentFinancials.ts`
- [ ] `useAgentAnalytics.ts`

---

## 🚀 Quick Start: Next 3 Tasks

Want to get started? Here are the first 3 tasks to tackle:

1. **Agent Profile Editing in Settings** (30 min)
   - Add tab in Settings page
   - Create edit form component
   - Wire up to existing `useAgents` hook

2. **Enhance Agent Dashboard** (45 min)
   - Add metrics cards
   - Show recent invitations
   - Display assigned entities

3. **Agent Directory Browser** (1 hour)
   - Create public directory page
   - Add filtering and sorting
   - Enable entity owners to find agents

---

**Ready to start?** Let me know which task you'd like to implement first!
