"use client";

import { useSearchParams } from "next/navigation";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username');

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        textAlign: "center",
      }}
    >
      <h1>Hello, {username}</h1>
    </div>
  );
}
