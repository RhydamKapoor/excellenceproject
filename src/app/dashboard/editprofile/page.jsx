import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EditProfileComp from "@/app/components/profile/EditProfileComp";
import { getServerSession } from "next-auth";


export default async function EditProfile() {
  const session = await getServerSession(authOptions);
  
  return (
    <main className="flex items-center h-full">
      <EditProfileComp session={session} />
    </main>
  );
}
