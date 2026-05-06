import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const { role } = router.query;

  return (
    <div style={{ padding: 50 }}>
      <h1>Dashboard {role}</h1>
      <button onClick={() => router.push("/")}>Logout</button>
    </div>
  );
}
