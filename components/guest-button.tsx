"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GuestButton() {
  const router = useRouter();

  const enterAsGuest = async () => {
    await fetch("/api/guest", { method: "POST" });
    router.push("/");
  };

  return (
    <Button onClick={enterAsGuest} variant="outline" className="w-full bg-gray-100 hover:text-white hover:bg-gray-400">
      Invitado / Guest
    </Button>
  );
}