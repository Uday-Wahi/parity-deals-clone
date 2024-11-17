import { db } from "@/db";
import {
  CountryGroupDiscountTable,
  ProductCustomizationTable,
  ProductTable,
} from "@/db/schema";
import {
  CACHE_TAGS,
  dbCache,
  getGlobalTag,
  getIdTag,
  getUserTag,
  revalidateDbCache,
} from "@/lib/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { BatchItem } from "drizzle-orm/batch";

export function getProductCountryGroups({
  productId,
  userId,
}: {
  productId: string;
  userId: string;
}) {
  const cacheFn = dbCache(getProductCountryGroupsInternal, {
    tags: [
      getIdTag(productId, CACHE_TAGS.products),
      getGlobalTag(CACHE_TAGS.countries),
      getGlobalTag(CACHE_TAGS.countryGroups),
    ],
  });
  return cacheFn({ productId, userId });
}

export function getProductCustomization({
  productId,
  userId,
}: {
  productId: string;
  userId: string;
}) {
  const cacheFn = dbCache(getProductCustomizationInternal, {
    tags: [getIdTag(productId, CACHE_TAGS.products)],
  });
  return cacheFn({ productId, userId });
}

export function getProducts(userId: string, { limit }: { limit?: number }) {
  // creating user cache for specific query
  const cacheFn = dbCache(getProductsInternal, {
    tags: [getUserTag(userId, CACHE_TAGS.products)],
  });
  return cacheFn(userId, { limit });
}

export function getProduct({ id, userId }: { id: string; userId: string }) {
  // creating user cache for specific query
  const cacheFn = dbCache(getProductInternal, {
    tags: [getIdTag(id, CACHE_TAGS.products)],
  });
  return cacheFn({ id, userId });
}

export async function createProduct(data: typeof ProductTable.$inferInsert) {
  const [newProduct] = await db
    .insert(ProductTable)
    .values(data)
    .returning({ id: ProductTable.id, userId: ProductTable.clerkUserId });

  try {
    await db
      .insert(ProductCustomizationTable)
      .values({ productId: newProduct.id })
      .onConflictDoNothing({
        target: ProductCustomizationTable.productId,
      });
  } catch (err) {
    await db.delete(ProductTable).where(eq(ProductTable.id, newProduct.id));
  }
  if (newProduct != null)
    // purge user cache on adding new product
    revalidateDbCache({
      tag: CACHE_TAGS.products,
      userId: newProduct.userId,
      id: newProduct.id,
    });

  return newProduct;
}

export async function updateProduct(
  data: Partial<typeof ProductTable.$inferInsert>,
  { id, userId }: { id: string; userId: string }
) {
  const { rowCount } = await db
    .update(ProductTable)
    .set(data)
    .where(and(eq(ProductTable.clerkUserId, userId), eq(ProductTable.id, id)));

  const isUpdateSuccess = rowCount > 0;

  if (isUpdateSuccess) {
    // purge user cache on product update
    revalidateDbCache({
      tag: CACHE_TAGS.products,
      userId,
      id,
    });
  }

  return isUpdateSuccess;
}

export async function deleteProduct(userId: string, id: string) {
  const { rowCount } = await db
    .delete(ProductTable)
    .where(and(eq(ProductTable.id, id), eq(ProductTable.clerkUserId, userId)));

  const isDeleteSuccess = rowCount > 0;

  if (isDeleteSuccess)
    // purge user cache on product delete
    revalidateDbCache({
      tag: CACHE_TAGS.products,
      userId,
      id,
    });

  return isDeleteSuccess;
}

export async function updateCountryDiscounts(
  insertGroups: (typeof CountryGroupDiscountTable.$inferInsert)[],
  deleteIds: { countryGroupId: string }[],
  { productId, userId }: { productId: string; userId: string }
) {
  const statements: BatchItem<"pg">[] = [];
  if (deleteIds.length > 0) {
    statements.push(
      db.delete(CountryGroupDiscountTable).where(
        and(
          eq(CountryGroupDiscountTable.productId, productId),
          inArray(
            CountryGroupDiscountTable.countryGroupId,
            deleteIds.map((group) => group.countryGroupId)
          )
        )
      )
    );
  }

  if (insertGroups.length > 0) {
    statements.push(
      db
        .insert(CountryGroupDiscountTable)
        .values(insertGroups)
        .onConflictDoUpdate({
          target: [
            CountryGroupDiscountTable.countryGroupId,
            CountryGroupDiscountTable.productId,
          ],
          set: {
            coupon: sql.raw(
              `excluded.${CountryGroupDiscountTable.coupon.name}`
            ),
            discountPercentage: sql.raw(
              `excluded.${CountryGroupDiscountTable.discountPercentage.name}`
            ),
          },
        })
    );
  }

  if (statements.length > 0) {
    await db.batch(statements as [BatchItem<"pg">]);
  }

  revalidateDbCache({
    tag: CACHE_TAGS.products,
    id: productId,
    userId,
  });
  return true;
}

export async function updateProductCustomization(
  data: Partial<typeof ProductCustomizationTable.$inferInsert>,
  { productId, userId }: { productId: string; userId: string }
) {
  const product = await getProduct({ id: productId, userId });
  if (!product) return false;

  const { rowCount } = await db
    .update(ProductCustomizationTable)
    .set(data)
    .where(eq(ProductCustomizationTable.productId, productId));

  const isUpdateSuccess = rowCount > 0;
  revalidateDbCache({
    tag: CACHE_TAGS.products,
    id: productId,
    userId,
  });

  return isUpdateSuccess;
}

function getProductsInternal(userId: string, { limit }: { limit?: number }) {
  return db.query.ProductTable.findMany({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    orderBy: ({ createdAt }, { desc }) => desc(createdAt),
    limit,
  });
}

function getProductInternal({ id, userId }: { id: string; userId: string }) {
  return db.query.ProductTable.findFirst({
    where: ({ clerkUserId, id: productId }, { eq, and }) =>
      and(eq(clerkUserId, userId), eq(productId, id)),
  });
}

async function getProductCountryGroupsInternal({
  productId,
  userId,
}: {
  productId: string;
  userId: string;
}) {
  const data = await db.query.CountryGroupTable.findMany({
    with: {
      countries: {
        columns: {
          name: true,
          code: true,
        },
      },
      countryGroupDiscounts: {
        columns: {
          coupon: true,
          discountPercentage: true,
        },
        where: ({ productId: id }, { eq }) => eq(id, productId),
        limit: 1,
      },
    },
  });

  return data.map((group) => {
    return {
      id: group.id,
      name: group.name,
      recommendedDiscountPercentage: group.recommendedDiscountPercentage,
      countries: group.countries,
      discount: group.countryGroupDiscounts.at(0),
    };
  });
}

async function getProductCustomizationInternal({
  productId,
  userId,
}: {
  productId: string;
  userId: string;
}) {
  const data = await db.query.ProductTable.findFirst({
    where: ({ id, clerkUserId }, { and, eq }) =>
      and(eq(id, productId), eq(clerkUserId, userId)),
    with: {
      productCustomization: true,
    },
  });
  return data?.productCustomization;
}
