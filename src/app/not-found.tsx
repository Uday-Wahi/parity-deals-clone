import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function NotFound() {
  const { userId } = await auth();
  const obj = userId
    ? { link: "/dashboard", text: "Back to dashboard" }
    : { link: "/", text: "Return Home" };

  return (
    <div className="mt-32 text-center text-balance">
      <h2 className="text-4xl font-semibold mb-2">Not Found</h2>
      <p className="mb-4">Could not find requested page</p>
      <Button size="lg" asChild>
        <Link href={obj.link}>{obj.text}</Link>
      </Button>
    </div>
  );
}
