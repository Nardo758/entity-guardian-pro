# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/30607303-0dd4-4632-9a1a-e8e6028aa50f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/30607303-0dd4-4632-9a1a-e8e6028aa50f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/30607303-0dd4-4632-9a1a-e8e6028aa50f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Subscriptions

This project uses Stripe Checkout for subscription creation and management. Our flow aligns with Stripe’s sample "Checkout single subscription":

- Reference: https://github.com/stripe-samples/checkout-single-subscription/branches
- Backend: Supabase Edge Functions create Checkout Sessions and handle webhooks
  - `create-checkout`: creates a subscription Checkout Session using Price IDs
  - `stripe-webhook`: processes `checkout.session.completed` and invoice events
- Frontend: calls `create-checkout` and opens Stripe Checkout via `redirectToCheckout`
- Pricing sync: `sync-pricing` upserts Products/Prices in Stripe and assigns lookup keys (e.g. `erp:starter:monthly`)

Test mode:
- Set `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- Set `STRIPE_SECRET_KEY=sk_test_...` in Supabase project secrets
- Run pricing sync: POST `.../sync-pricing`

Production:
- Swap to `pk_live_...` and `sk_live_...`
- Update webhook endpoint in Stripe to your deployed function URL and set the signing secret in Supabase (`STRIPE_WEBHOOK_SECRET`)
