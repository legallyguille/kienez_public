import PortfolioClient from "./portfolioClient";
import { getCurrentUser } from "@/lib/session";
import "@/i18n"

export default async function PortfolioPage() {
  const user = await getCurrentUser();

  return (
    <PortfolioClient
      isGuest={!user}
      user={user ? { id: user.id, nombre: user.nombre, role: user.role } : null}
    />
  );
}
