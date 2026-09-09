import type Stripe from 'stripe';

export type StripeClient = Pick<Stripe, 'customers' | 'checkout' | 'webhooks'>;

export interface StripeServiceConfig {
  stripe: StripeClient;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  webhookSecret: string;
}

export interface CustomerOwner {
  id: string;
  email: string;
  stripeCustomerId: string | null;
}

export function createStripeService({ stripe, priceId, successUrl, cancelUrl, webhookSecret }: StripeServiceConfig) {
  async function ensureCustomer(user: CustomerOwner): Promise<string> {
    if (user.stripeCustomerId) return user.stripeCustomerId;
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    return customer.id;
  }

  async function createCheckoutSession(customerId: string): Promise<string> {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    if (!session.url) {
      throw new Error('STRIPE_SESSION_MISSING_URL');
    }
    return session.url;
  }

  function verifyWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  return { ensureCustomer, createCheckoutSession, verifyWebhookEvent };
}

export type StripeService = ReturnType<typeof createStripeService>;
