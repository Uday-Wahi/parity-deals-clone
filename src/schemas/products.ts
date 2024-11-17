import { z } from "zod";

// http://www.abc.com/sales
const urlRegex = new RegExp(
  "^" +
    "(?:https?://)" +
    "(?:[a-zA-Z][a-zA-Z0-9-]*\\.)" +
    "[a-zA-Z][a-zA-Z0-9-]*" +
    "\\.[a-zA-Z]{2,6}/?.*" +
    "$",
  "i"
);

export const productDetailsSchema = z.object({
  name: z.string().min(4),
  url: z.string().refine((url) => urlRegex.test(url), {
    message: "Please enter a valid URL",
  }),
  description: z.string().optional(),
});

export const productCountryGroupsSchema = z.object({
  groups: z.array(
    z
      .object({
        countryGroupId: z.string().min(1),
        coupon: z.string().optional(),
        discountPercentage: z
          .number()
          .min(1)
          .max(100)
          .or(z.nan())
          .transform((n) => (isNaN(n) ? undefined : n))
          .optional(),
      })
      .refine(
        (value) => {
          const hasCoupon = value.coupon != null && value.coupon.length > 0;
          const hasDiscount = value.discountPercentage != null;
          return !(hasCoupon && !hasDiscount);
        },
        {
          message: "A discount is required if a coupon code is provided",
          path: ["root"],
        }
      )
  ),
});

export const productCustomizationSchema = z.object({
  classPrefix: z.string().optional(),
  backgroundColor: z.string().min(1),
  textColor: z.string().min(1),
  fontSize: z.string().min(1),
  locationMessage: z.string().min(1),
  bannerContainer: z.string().min(1),
  isSticky: z.boolean(),
});
