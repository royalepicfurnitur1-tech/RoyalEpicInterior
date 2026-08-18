sed -i '11a\import { AdminOrdersManagement } from "./AdminOrdersManagement";' src/components/AdminDashboard.tsx
sed -i '/{activeTab === '"'"'crm'"'"' && (/i\          {activeTab === '"'"'orders'"'"' && (\n            <AdminOrdersManagement />\n          )}\n' src/components/AdminDashboard.tsx
