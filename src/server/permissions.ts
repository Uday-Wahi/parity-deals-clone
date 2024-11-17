import { getUserSubscriptionTier } from "./db/subscription";

export async function getUserSubscriptionInfo(userId: string) {
  return await getUserSubscriptionTier(userId);
}

export async function canRemoveBranding(userId: string) {
  const tier = await getUserSubscriptionTier(userId);
  return tier.canRemoveBranding;
}

export async function canCustomizeBanner(userId: string) {
  const tier = await getUserSubscriptionTier(userId);
  return tier.canCustomizeBanner;
}

export async function canAccessAnalytics(userId: string) {
  const tier = await getUserSubscriptionTier(userId);
  return tier.canAccessAnalytics;
}
