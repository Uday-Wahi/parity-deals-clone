"use client";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteProductAction } from "@/server/actions/products";
import { useTransition } from "react";

export default function DeleteProductAlertDialogContent({
  id,
}: {
  id: string;
}) {
  const [isDeletePending, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure ?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete this
          product.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button variant="destructive" asChild>
          <AlertDialogAction
            disabled={isDeletePending}
            onClick={() => {
              startDeleteTransition(async () => {
                const data = await deleteProductAction(id);
                if (data.message) {
                  toast({
                    title: data.error ? "Error" : "Success",
                    description: data.message,
                    variant: data.error ? "destructive" : "default",
                  });
                }
              });
            }}
          >
            Delete
          </AlertDialogAction>
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
