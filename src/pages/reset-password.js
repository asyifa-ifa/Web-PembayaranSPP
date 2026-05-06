import { useRouter } from "next/router";
import { useState } from "react";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      router.push("/login");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Reset Password</h2>

      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Password baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />
        <button type="submit">Reset</button>
      </form>
    </div>
  );
}