export function normalizeBudgetProfile(profile) {
  return {
    income: normalizeNumber(profile.income),
    fixedExpenses: normalizeNumber(profile.fixedExpenses),
    savingsGoal: normalizeNumber(profile.savingsGoal),
  };
}

export function normalizeWishlistItem(item) {
  return {
    name: String(item.name || '').trim(),
    cost: normalizeNumber(item.cost),
    priority: normalizePriority(item.priority),
  };
}

export function makeChatTitle(message) {
  const title = String(message || '').trim().replace(/\s+/g, ' ');
  return title.length > 42 ? `${title.slice(0, 42)}...` : title || 'New chat';
}

export function buildSystemPrompt({ profile, wishlistItems }) {
  const safeProfile = normalizeBudgetProfile(profile || {});
  const discretionaryAmount =
    safeProfile.income - safeProfile.fixedExpenses - safeProfile.savingsGoal;
  const wishlistSummary =
    wishlistItems?.length > 0
      ? wishlistItems
          .map(
            (item) =>
              `${item.name} (${formatInr(item.cost)}, ${item.priority} priority, added ${formatDate(
                item.dateAdded,
              )})`,
          )
          .join('; ')
      : 'No wishlist items saved yet.';

  return `You are a warm, empathetic personal budget advisor. The user is a developer at a startup in India. Their budget context: income ${formatInr(
    safeProfile.income,
  )}, fixed expenses ${formatInr(
    safeProfile.fixedExpenses,
  )}, savings goal ${formatInr(
    safeProfile.savingsGoal,
  )}, discretionary amount ${formatInr(discretionaryAmount)}, wishlist items ${wishlistSummary}. Detect emotional tone - if they sound stressed or impulsive about money, acknowledge it before advising. For any purchase question, always give a clear recommendation: buy now / wait 1 month / wait 2+ months, with a short human reason.`;
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizePriority(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'high') {
    return 'High';
  }

  if (normalized === 'low') {
    return 'Low';
  }

  return 'Medium';
}

function formatInr(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(normalizeNumber(value));
}

function formatDate(value) {
  if (!value) {
    return 'today';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}