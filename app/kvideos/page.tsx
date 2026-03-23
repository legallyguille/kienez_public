import { getCurrentUser } from "@/lib/session";
import VideosClient from "./videosCliente";

export default async function VideosPage() {
  const user = await getCurrentUser();
  console.log("User in VideosPage:", user);

  return (
    <>
      <VideosClient
        isGuest={!user}
        user={
          user ? { id: user.id, nombre: user.nombre, role: user.role } : null
        }
      />
    </>
  );
}
