import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const { isAdmin, roles } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl font-bold">Добро пожаловать в CRM</h1>
      <p className="text-muted-foreground">
        Роль: {roles.join(", ") || "не назначена"}
        {isAdmin && " — у вас полный доступ."}
      </p>
      <p className="text-sm text-muted-foreground">
        Модули заявок, клиентов и сделок появятся в следующих этапах.
      </p>
    </div>
  );
};

export default AdminDashboard;