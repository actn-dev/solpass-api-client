# SolPass API Client - Implementation Plan

## Overview
Build a minimal UI demo showing how a third-party integrates SolPass ticketing API with view mode simulation.

## Fixed Auth Credentials
- Email: `partner@example.com`
- Password: `StrongPass123!`
- Auto-login on app start, store JWT for API calls

## Pages to Build

### 1. **Home/Dashboard** (`/`)
- Mode switcher: `[Shop Admin] [User1] [User2]`
- Show current mode + wallet address
- Navigation to Events List

### 2. **Events List** (`/events`)
- Display all events (GET `/api/v1/events`)
- **Shop Admin Mode**: Show "Create Event" button
- **All Modes**: Click event → go to Event Detail

### 3. **Create Event Modal/Page** (`/events/new`)
- Form fields:
  - Event ID, Name, Description, Venue
  - Event Date, Total Tickets, Ticket Price
  - Royalty Partners (partyName, percentage, walletAddress)
- Actions:
  - Create Event (POST `/api/v1/events`)
  - Initialize Blockchain (POST `/api/v1/events/{id}/initialize-blockchain`)
  - Enable Partner USDC (POST `/api/v1/events/{id}/enable-partner-usdc`)

### 4. **Event Detail** (`/events/[eventId]`)
- Show event info
- Display 3 tickets with IDs: `{eventId}-ticket-1`, `{eventId}-ticket-2`, `{eventId}-ticket-3`
- **Shop Admin Mode**: View only, show stats
- **User1 Mode**: 
  - Buy ticket button → POST to purchase
  - If owned, show "Resell" with price input
- **User2 Mode**: 
  - Buy resold tickets from User1
  - If owned, show "Resell" option

## API Flow Implementation

### Auth Flow
1. Auto-login on mount → store JWT in context/state
2. Add JWT to all API request headers

### Ticket Purchase Flow
- POST `/api/v1/events/{eventId}/tickets`
- Body includes: ticketId, buyerWallet, sellerWallet, price, buyerId, sellerId

### Mode Simulation
- **Shop Admin**: Uses partner wallet
- **User1**: Mock wallet `User1...wallet`
- **User2**: Mock wallet `User2...wallet`

## Tech Stack
- **UI Library**: shadcn/ui (button, card, input, dialog, select)
- **API Client**: Existing `lib/api-client.ts` (typed with openapi-typescript)
- **State**: React Context or useState for auth + mode switching

## File Structure
```
app/
  page.tsx              → Dashboard with mode switcher
  events/
    page.tsx            → Events list
    [eventId]/
      page.tsx          → Event detail + tickets
  components/
    create-event-dialog.tsx
    ticket-card.tsx
    mode-switcher.tsx
lib/
  api-client.ts         → Enhanced with auth headers
  hooks/
    use-auth.ts         → Auth context/hook
```

## Success Criteria
✅ Login with fixed credentials  
✅ Create event + initialize blockchain  
✅ Switch between Shop/User1/User2 modes  
✅ User1 buys ticket → resells  
✅ User2 buys resold ticket → resells again  
✅ All API calls properly authenticated  

---

**Awaiting approval to proceed** ✋
