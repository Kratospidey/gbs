import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null; // Retrieve JWT from localStorage

    useEffect(() => {
      if (!token) {
        // Redirect to login if no token is found
        router.push("/login");
      }
    }, [router, token]);

    // If token is present, render the component
    return token ? <Component {...props} /> : null;
  };
}
