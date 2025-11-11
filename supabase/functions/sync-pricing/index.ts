import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TierDef = {
  id: string;
  name: string;
  monthlyPrice: number; // USD dollars
  yearlyPrice: number;  // USD dollars
  description: string;
  features: string[];
};

// Keep in sync with src/lib/stripe.ts (landing page pricing)
const TIERS: TierDef[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small businesses",
    monthlyPrice: 19,
    yearlyPrice: 191,
    features: [
      "Up to 4 entities",
      "Basic notifications",
      "Email support",
      "Standard templates",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "Most popular for growing businesses",
    monthlyPrice: 49,
    yearlyPrice: 492,
    features: [
      "Up to 20 entities",
      "Advanced notifications",
      "API access",
      "Custom reports",
      "Chat support",
      "Team collaboration",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For established businesses",
    monthlyPrice: 99,
    yearlyPrice: 994,
    features: [
      "Up to 50 entities",
      "Advanced notifications",
      "Phone support",
      "Advanced analytics",
      "API access",
      "Custom reports",
      "International coverage",
      "Team collaboration",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: 249,
    yearlyPrice: 2500,
    features: [
      "Up to 150 entities",
      "Advanced notifications",
      "Dedicated account manager",
      "Full API access",
      "Advanced analytics",
      "Custom reports",
      "White label options",
      "Unlimited users",
      "Priority processing",
      "Custom integrations",
    ],
  },
];

function lookupKey(tierId: string, billing: "monthly" | "yearly"): string {
  return `erp:${tierId}:${billing}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const results: Record<string, { productId: string; monthlyPriceId: string; yearlyPriceId: string }> = {};

    for (const tier of TIERS) {
      // Upsert product by metadata.tier_id
      const products = await stripe.products.list({ limit: 100, active: true });
      let product = products.data.find(p => (p.metadata as any)?.tier_id === tier.id || p.name === `Entity Renewal Pro - ${tier.name}`);
      if (!product) {
        product = await stripe.products.create({
          name: `Entity Renewal Pro - ${tier.name}`,
          description: tier.description,
          metadata: { tier_id: tier.id },
        });
      } else {
        // Ensure name/description/metadata are up to date
        await stripe.products.update(product.id, {
          name: `Entity Renewal Pro - ${tier.name}`,
          description: tier.description,
          metadata: { ...product.metadata, tier_id: tier.id },
          active: true,
        });
      }

      // Helper to upsert a price for a billing interval
      const ensurePrice = async (billing: "monthly" | "yearly", dollars: number) => {
        const lk = lookupKey(tier.id, billing);
        const existing = await stripe.prices.list({ lookup_keys: [lk], active: true, limit: 1 });
        const wantedAmount = Math.round(dollars * 100);

        if (existing.data.length > 0) {
          const price = existing.data[0];
          const matches = price.unit_amount === wantedAmount && price.recurring?.interval === (billing === "yearly" ? "year" : "month") && price.product === product!.id && price.currency === "usd";
          if (matches) return price.id;
          // Archive old and remove lookup_key then create new one
          await stripe.prices.update(price.id, { active: false, lookup_key: `${lk}:archived:${Date.now()}` });
        }

        const newPrice = await stripe.prices.create({
          currency: "usd",
          unit_amount: wantedAmount,
          product: product!.id,
          recurring: { interval: billing === "yearly" ? "year" : "month" },
          lookup_key: lk,
          nickname: `${tier.name} - ${billing}`,
        });
        return newPrice.id;
      };

      const monthlyPriceId = await ensurePrice("monthly", tier.monthlyPrice);
      const yearlyPriceId = await ensurePrice("yearly", tier.yearlyPrice);
      results[tier.id] = { productId: product.id, monthlyPriceId, yearlyPriceId };
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

export const verifyJWT = false;
