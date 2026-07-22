const baseStyle = `
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

export const paymentApprovedTemplate = (userName: string, itemTitle: string, amount: number) => `
<div style="${baseStyle}">
  <h2 style="color: #008000;">Payment Approved</h2>
  <p>Hi ${userName},</p>
  <p>Your payment for <strong>"${itemTitle}"</strong> has been approved.</p>
  <p>Amount: <strong>€${amount.toFixed(2)}</strong></p>
  <p>Thank you for using DealClosedPartner!</p>
</div>
`;

export const paymentRejectedTemplate = (userName: string) => `
<div style="${baseStyle}">
  <h2 style="color: #cc0000;">Payment Rejected</h2>
  <p>Hi ${userName},</p>
  <p>Your payment has been rejected and refunded to your account.</p>
  <p>If you have any questions, please contact support.</p>
</div>
`;

export const applicationReceivedTemplate = (companyName: string, jobTitle: string, freelancerName: string) => `
<div style="${baseStyle}">
  <h2 style="color: #008000;">New Application Received</h2>
  <p>Hi ${companyName},</p>
  <p><strong>${freelancerName}</strong> has applied for your assignment <strong>"${jobTitle}"</strong>.</p>
  <p>Log in to your dashboard to review the application.</p>
</div>
`;

export const applicantAcceptedTemplate = (freelancerName: string, jobTitle: string) => `
<div style="${baseStyle}">
  <h2 style="color: #008000;">Application Accepted!</h2>
  <p>Hi ${freelancerName},</p>
  <p>Your application for <strong>"${jobTitle}"</strong> has been accepted.</p>
  <p>You can now proceed to work on the assignment.</p>
</div>
`;

export const payoutApprovedTemplate = (userName: string, amount: number, method: string) => `
<div style="${baseStyle}">
  <h2 style="color: #008000;">Payout Approved</h2>
  <p>Hi ${userName},</p>
  <p>Your payout request of <strong>€${amount.toFixed(2)}</strong> via <strong>${method.toUpperCase()}</strong> has been approved.</p>
  <p>The funds will be transferred shortly.</p>
</div>
`;

export const payoutRejectedTemplate = (userName: string, amount: number) => `
<div style="${baseStyle}">
  <h2 style="color: #cc0000;">Payout Rejected</h2>
  <p>Hi ${userName},</p>
  <p>Your payout request of <strong>€${amount.toFixed(2)}</strong> has been rejected.</p>
  <p>Please check your account details and try again, or contact support.</p>
</div>
`;

export const referralBonusTemplate = (userName: string, bonus: number) => `
<div style="${baseStyle}">
  <h2 style="color: #008000;">Referral Bonus Earned!</h2>
  <p>Hi ${userName},</p>
  <p>You earned a referral bonus of <strong>€${bonus.toFixed(2)}</strong> from a referred user's activity.</p>
  <p>Keep sharing your referral link to earn more!</p>
</div>
`;

export const courseSoldTemplate = (sellerName: string, courseTitle: string, amount: number) => `
<div style="${baseStyle}">
  <h2 style="color: #008000;">Course Sold!</h2>
  <p>Hi ${sellerName},</p>
  <p>Your course <strong>"${courseTitle}"</strong> has been purchased for <strong>€${amount.toFixed(2)}</strong>.</p>
  <p>The buyer now has access to the course.</p>
</div>
`;
