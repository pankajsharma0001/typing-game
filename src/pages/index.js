import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load

    if (session) {
      // If logged in, redirect to dashboard
      router.replace("/dashboard");
    } else {
      // If not logged in, redirect to login page
      router.replace("/login");
    }
  }, [session, status]);

  return <p>Loading...</p>;
}
