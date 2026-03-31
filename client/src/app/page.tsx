"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{ padding: 20 }}>
      <h1>StyleSense</h1>
      <p>Upload a photo to get your color and outfit recommendations.</p>

      <button
        onClick={() => router.push("/upload")}
        style={{
          marginTop: 20,
          padding: 10,
          backgroundColor: "black",
          color: "white",
          cursor: "pointer",
        }}
      >
        Upload Photo
      </button>
    </div>
  );
}
