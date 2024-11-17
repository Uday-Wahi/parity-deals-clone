import BrandLogo from "@/components/BrandLogo";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="flex py-6 shadow bg-background">
      <nav className="flex items-center gap-5 sm:gap-8 md:gap-10 container font-semibold">
        <Link href="/" className="mr-auto">
          <BrandLogo />
        </Link>
        <Link className="text-lg" href="/dashboard/products">
          Products
        </Link>
        <Link className="text-lg" href="/dashboard/analytics">
          Analytics
        </Link>
        <Link className="text-lg" href="/dashboard/subscription">
          Subscription
        </Link>
        <UserButton />
      </nav>
    </header>
  );
}
