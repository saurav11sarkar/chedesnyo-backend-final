import { Request, Response } from 'express';
import Stripe from 'stripe';
import config from '../../config';
import Payment from '../payment/payment.model';
import Assigment from '../assigment/assigment.model';
import Course from '../course/course.model';
import { promotionService } from '../promotion/promotion.service';

const stripe = new Stripe(config.stripe.secretKey!);

const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret!,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    // ✅ Step 1: Payment success from Stripe
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await Payment.findOne({ stripeSessionId: session.id });

      if (payment) {
        payment.status = 'pending';
        payment.stripePaymentIntentId = session.payment_intent as string;
        await payment.save();

        if (payment.assigment) {
          const assasmt = await Assigment.findById(payment.assigment);
          if (assasmt) {
            if (!assasmt.application) assasmt.application = [];
            if (!assasmt.application.includes(payment.user)) {
              assasmt.application.push(payment.user);
              await assasmt.save();
            }
          }
        }

        if (payment.course) {
          const course = await Course.findById(payment.course);
          if (course) {
            if (!course.application) course.application = [];
            if (!course.application.includes(payment.user)) {
              course.application.push(payment.user);
              await course.save();
            }
          }
        }
      } else {
        await promotionService.activatePromotion(session.id);
      }
    }

    // ❌ Step 3: Handle failed payments
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });
      if (payment) {
        payment.status = 'denied';
        await payment.save();
      }
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(500).send(`Webhook Error: ${(error as Error).message}`);
  }
};

export default stripeWebhook;