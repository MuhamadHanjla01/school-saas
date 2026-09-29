const { field: f } = require('./adminValidation');
const required = { required: true };
const title = f('title', 'Title', 'text', required);
const status = (options) => f('status', 'Status', 'select', { options, default: options[0] });
const content = f('content', 'Content', 'textarea', required);
const catalog = {
  inquiries: { title: 'School Inquiries', fields: [title, f('email', 'Contact email', 'email', required), f('school', 'School', 'text', required), content, status(['New', 'Contacted', 'Qualified', 'Closed'])] },
  contacts: { title: 'Contact Inquiry', fields: [title, f('email', 'Email', 'email', required), content, status(['New', 'In Progress', 'Closed'])] },
  addons: { title: 'Addons', description: 'Maintain the addon catalog. These entries do not change school permissions or bill accounts.', fields: [title, f('priceMinor', 'Price (minor currency units)', 'number', { default: 0 }), f('currency', 'Currency', 'select', { options: ['usd', 'inr', 'npr', 'eur', 'gbp'], default: 'usd' }), content, status(['Active', 'Inactive'])] },
  features: { title: 'Features', description: 'Feature catalog for plan descriptions. Access is enforced by account roles.', fields: [title, content, status(['Active', 'Inactive'])] },
  coupons: { title: 'Coupons & Discounts', description: 'Internal discount register. Automatic checkout redemption is not connected.', fields: [title, f('discountPercent', 'Discount percent', 'number', { required: true, max: 100 }), f('expiresAt', 'Expires', 'date', required), status(['Active', 'Inactive'])] },
  articles: { title: 'Knowledge Base', fields: [title, f('category', 'Category'), content, status(['Draft', 'Published'])] },
  templates: { title: 'Templates', fields: [title, f('channel', 'Channel', 'select', { options: ['Email', 'SMS', 'WhatsApp', 'Push'], default: 'Email' }), content] },
  email: { title: 'Email Schools', description: 'Save campaign drafts. Delivery requires a configured email provider; drafts are never reported as sent.', fields: [title, f('recipients', 'Recipient emails', 'textarea', required), content] },
  sms: { title: 'SMS / WhatsApp', description: 'Save message drafts. Delivery requires a configured messaging provider.', fields: [title, f('channel', 'Channel', 'select', { options: ['SMS', 'WhatsApp'], default: 'SMS' }), f('recipients', 'Recipient phone numbers', 'textarea', required), content] },
};
const settings = {
  system: { title: 'System Settings', fields: [f('name', 'Platform name', 'text', { required: true, default: 'ERPZO' }), f('supportEmail', 'Support email', 'email'), f('timezone', 'Display timezone', 'text', { default: 'UTC' })] },
  website: { title: 'Web Settings', description: 'Saved website content configuration for use by the public site.', fields: [f('headline', 'Headline'), f('description', 'Description', 'textarea'), f('contactEmail', 'Contact email', 'email')] },
  academy: { title: 'Academy Setup', fields: [f('academicYear', 'Default academic year'), f('termName', 'Default term'), f('registrationPrefix', 'Registration prefix')] },
  branding: { title: 'White-label', fields: [f('brandName', 'Brand name'), f('primaryColor', 'Primary color'), f('footer', 'Footer text')] },
};
const planFields = [f('name', 'Name', 'text', required), f('priceMinor', 'Price (minor currency units)', 'number', { default: 0 }), f('currency', 'Currency', 'select', { options: ['usd', 'inr', 'npr', 'eur', 'gbp'], default: 'usd' }), f('interval', 'Billing interval', 'select', { options: ['Monthly', 'Yearly'], default: 'Monthly' }), f('studentLimit', 'Student limit', 'number', { default: 500, min: 1 }), f('storageGb', 'Storage (GB)', 'number', { default: 10, min: 1 }), f('features', 'Included features', 'textarea'), f('active', 'Active', 'checkbox', { default: true })];
const ticketFields = [f('schoolId', 'School', 'select', required), f('subject', 'Subject', 'text', required), f('description', 'Description', 'textarea', required), f('priority', 'Priority', 'select', { options: ['Normal', 'High', 'Urgent'], default: 'Normal' }), status(['Open', 'In Progress', 'Resolved', 'Closed']), f('response', 'Response', 'textarea')];
module.exports = { catalog, settings, planFields, ticketFields };
