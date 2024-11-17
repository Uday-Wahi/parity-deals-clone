"use server";

import { CountryGroupDiscountTable } from "@/db/schema";
import {
  productCountryGroupsSchema,
  productCustomizationSchema,
  productDetailsSchema,
} from "@/schemas/products";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createProduct,
  deleteProduct,
  updateCountryDiscounts,
  updateProduct,
  updateProductCustomization,
} from "../db/products";
import { canCustomizeBanner } from "../permissions";

export async function createProductAction(
  unsafeData: z.infer<typeof productDetailsSchema>
): Promise<{ error: boolean; message: string } | undefined> {
  const { userId } = await auth();
  const { success, data } = productDetailsSchema.safeParse(unsafeData);

  if (!success || userId == null)
    return { error: true, message: "There was an error creating your product" };

  const { id } = await createProduct({ clerkUserId: userId, ...data });

  redirect(`/dashboard/products/${id}/edit?tab=countries`);
}

export async function updateProductAction(
  id: string,
  unsafeData: z.infer<typeof productDetailsSchema>
) {
  const { userId } = await auth();
  const { success, data } = productDetailsSchema.safeParse(unsafeData);
  const errMessage = "There was an error updating your product";

  if (!success || userId == null) return { error: true, message: errMessage };

  const isSuccess = await updateProduct(data, { id, userId });

  return {
    error: !isSuccess,
    message: isSuccess ? "Product details updated" : errMessage,
  };
}

export async function deleteProductAction(id: string) {
  const { userId } = await auth();
  const errMessage = "There was an error deleting your product";

  if (userId == null) return { error: true, message: errMessage };

  const isSuccess = await deleteProduct(userId, id);

  return {
    error: !isSuccess,
    message: isSuccess ? "Successfully deleted your product" : errMessage,
  };
}

export async function updateCountryDiscountsAction(
  productId: string,
  unsafeData: z.infer<typeof productCountryGroupsSchema>
) {
  const { userId } = await auth();
  const { success, data } = productCountryGroupsSchema.safeParse(unsafeData);
  const errMessage = "There was an error saving your country discounts";

  if (!success || userId == null)
    return {
      error: true,
      message: errMessage,
    };

  const insert: (typeof CountryGroupDiscountTable.$inferInsert)[] = [];
  const deleteIds: { countryGroupId: string }[] = [];

  data.groups.forEach((group) => {
    const { coupon, countryGroupId, discountPercentage } = group;
    if (
      coupon != null &&
      coupon.length > 0 &&
      discountPercentage != null &&
      discountPercentage > 0
    ) {
      insert.push({
        countryGroupId,
        coupon,
        discountPercentage: discountPercentage / 100,
        productId,
      });
    } else {
      deleteIds.push({ countryGroupId });
    }
  });

  const isSuccess = await updateCountryDiscounts(insert, deleteIds, {
    productId,
    userId,
  });

  return {
    error: !isSuccess,
    message: isSuccess ? "Country discounts saved" : errMessage,
  };
}

export async function updateProductCustomizationAction(
  productId: string,
  unSafeData: z.infer<typeof productCustomizationSchema>
) {
  const { userId } = await auth();
  const { success, data } = productCustomizationSchema.safeParse(unSafeData);
  if (!userId) return;
  const canCustomize = await canCustomizeBanner(userId);
  const errMessage = "There was an error updating your banner";

  if (!success || !canCustomize) return { error: true, message: errMessage };

  const isSuccess = await updateProductCustomization(data, {
    productId,
    userId,
  });

  return {
    error: !isSuccess,
    message: isSuccess ? "Banner updated" : errMessage,
  };
}
