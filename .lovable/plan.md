

# Email Delivery for Onboarding Invitations

## What We're Building

When an HR staff member creates an invitation, the system will automatically send a professional email to the candidate with a direct link to their onboarding form. The candidate can open this link on any device (phone, tablet, desktop) and complete the form immediately.

## How It Works

1. HR creates an invitation (as they do today)
2. The system automatically sends a branded email with the onboarding link
3. The invitation status is updated to "SENT"
4. The candidate clicks the link in the email and fills out the form on any device
5. HR can also manually resend or copy the link from the Invitations view

## Technical Approach

### 1. Backend Function for Sending Emails

We'll create a backend function called `send-invitation-email` that:
- Accepts an invitation ID and employee email
- Builds a professional, mobile-friendly HTML email with Ljungan Forestry branding
- Includes a direct link to the onboarding form (e.g. `https://onboardbuddy-flow.lovable.app/onboard/{token}`)
- Sends the email using the built-in Lovable Cloud email service (Resend)
- Updates the invitation status from PENDING to SENT

**Important**: This requires a **Resend API key** to send emails. You'll be asked to provide one during implementation.

### 2. Email Content

The email will include:
- Ljungan Forestry header/branding
- Greeting with the candidate's name
- Clear call-to-action button linking to the onboarding form
- Expiration date notice (7 days)
- Mobile-responsive HTML layout

### 3. Frontend Changes

**CreateInvitationDialog**: After successfully creating the invitation, automatically call the email-sending function. Add a checkbox option "Send email now" (checked by default).

**InvitationsView**: The existing "Mark as Sent" and "Resend" actions will trigger the email function, allowing HR to re-send the email at any time.

### 4. Mobile-Ready Onboarding Form

The existing onboarding portal at `/onboard/{token}` already works on mobile devices since it's built with responsive Tailwind CSS. No changes needed here -- candidates can open the link on their phone and fill out the form immediately.

## Implementation Steps

1. Set up the Resend API key (you'll need to create a free account at resend.com)
2. Create the `send-invitation-email` backend function with branded HTML template
3. Update `CreateInvitationDialog` to trigger email sending after invitation creation
4. Add "Resend Email" action to the Invitations table
5. Test the full flow end-to-end

## What You'll Need

- A **Resend** account (free tier supports 100 emails/day) -- sign up at [resend.com](https://resend.com)
- A verified sender domain or use Resend's default `onboarding@resend.dev` for testing

