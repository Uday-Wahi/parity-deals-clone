"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { productCountryGroupsSchema } from "@/schemas/products";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import CountryFlag from "../CountryFlag";
import { toast } from "@/hooks/use-toast";
import { updateCountryDiscountsAction } from "@/server/actions/products";

export default function CountryDiscountForm({
  productId,
  countryGroups,
}: {
  productId: string;
  countryGroups: {
    id: string;
    name: string;
    recommendedDiscountPercentage: number | null;
    countries: {
      name: string;
      code: string;
    }[];
    discount?: {
      coupon: string;
      discountPercentage: number;
    };
  }[];
}) {
  const form = useForm<z.infer<typeof productCountryGroupsSchema>>({
    resolver: zodResolver(productCountryGroupsSchema),
    defaultValues: {
      groups: countryGroups.map((group) => {
        const discount =
          group.discount?.discountPercentage ??
          group.recommendedDiscountPercentage;
        return {
          countryGroupId: group.id,
          coupon: group.discount?.coupon ?? "",
          discountPercentage: discount != null ? discount * 100 : undefined,
        };
      }),
    },
  });

  async function onSubmit(values: z.infer<typeof productCountryGroupsSchema>) {
    const data = await updateCountryDiscountsAction(productId, values);

    if (data.message) {
      toast({
        title: data.error ? "Error" : "Success",
        description: data.message,
        variant: data.error ? "destructive" : "default",
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col"
      >
        {countryGroups.map((group, index) => (
          <Card key={group.id}>
            <CardContent className="pt-6 flex gap-8 items-center">
              <div>
                <h2 className="text-muted-foreground text-sm font-semibold mb-2">
                  {group.name}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {group.countries.map((country) => (
                    <CountryFlag
                      key={country.code}
                      countryCode={country.code}
                    />
                  ))}
                </div>
              </div>
              <Input
                type="hidden"
                {...form.register(`groups.${index}.countryGroupId`)}
              />
              <div className="ml-auto flex flex-shrink-0 gap-2 flex-col w-min">
                <div className="flex gap-4">
                  <FormField
                    name={`groups.${index}.discountPercentage`}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                            min={0}
                            max={100}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name={`groups.${index}.coupon`}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon</FormLabel>
                        <FormControl>
                          <Input className="w-48" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage>
                  {form.formState.errors.groups?.[index]?.root?.message}
                </FormMessage>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="self-end">
          <Button disabled={form.formState.isSubmitting}>Save</Button>
        </div>
      </form>
    </Form>
  );
}
