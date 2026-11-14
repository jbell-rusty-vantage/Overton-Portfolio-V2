import { officePage } from "@/components/admin/office-page";
import { requireAdmin } from "@/lib/auth/session";
import { getCollection } from "@/lib/library/catalog";
import Portfolio from "@/components/portfolio/Portfolio";
async function Preview() {
  await requireAdmin();
  return <Portfolio data={await getCollection({ admin: true })} admin />;
}
export default officePage(Preview);
