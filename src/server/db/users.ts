import { db } from "@/db";
import { ProductTable, UserSubscriptionTable } from "@/db/schema";
import { CACHE_TAGS, revalidateDbCache } from "@/lib/cache";
import { eq } from "drizzle-orm";

export async function deleteUser(clerkUserId: string) {
  const [userSubscription, products] = await db.batch([
    db
      .delete(UserSubscriptionTable)
      .where(eq(UserSubscriptionTable.clerkUserId, clerkUserId))
      .returning({ id: UserSubscriptionTable.id }),
    db
      .delete(ProductTable)
      .where(eq(ProductTable.clerkUserId, clerkUserId))
      .returning({ id: ProductTable.id }),
  ]);

  if (userSubscription[0] != null && products[0] != null) {
    userSubscription.forEach((item) =>
      revalidateDbCache({
        tag: CACHE_TAGS.subscription,
        id: item.id,
        userId: clerkUserId,
      })
    );
    products.forEach((item) =>
      revalidateDbCache({
        tag: CACHE_TAGS.products,
        id: item.id,
        userId: clerkUserId,
      })
    );
  }
  return [userSubscription, products];
}
