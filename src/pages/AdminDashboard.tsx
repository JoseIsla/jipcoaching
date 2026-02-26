import { motion } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCards from "@/components/admin/dashboard/StatCards";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import ClientEvolutionChart from "@/components/admin/dashboard/ClientEvolutionChart";

const item = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as const },
});

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Greeting */}
        <motion.div {...item(0)}>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen general de tu actividad
          </p>
        </motion.div>

        <StatCards />
        <QuickActions />
        <ClientEvolutionChart />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
