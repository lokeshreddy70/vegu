import { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { api } from './lib/api';

type OpsUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  staffProfile?: {
    store?: { id: string; name: string; code: string; city: string };
  };
};

type LoginResponse = {
  user: OpsUser;
  accessToken: string;
  refreshToken: string;
};

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

const readUser = (): OpsUser | null => {
  const raw = localStorage.getItem('vegu_ops_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OpsUser;
  } catch {
    return null;
  }
};

const saveAuth = (payload: LoginResponse) => {
  localStorage.setItem('vegu_ops_access_token', payload.accessToken);
  localStorage.setItem('vegu_ops_refresh_token', payload.refreshToken);
  localStorage.setItem('vegu_ops_user', JSON.stringify(payload.user));
};

const clearAuth = () => {
  localStorage.removeItem('vegu_ops_access_token');
  localStorage.removeItem('vegu_ops_refresh_token');
  localStorage.removeItem('vegu_ops_user');
};

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: async () => {
      loginSchema.parse({ identifier, password });
      const res = await api.post('/api/operations/auth/login', { identifier, password });
      return res.data.data as LoginResponse;
    },
    onSuccess: (data) => {
      saveAuth(data);
      toast.success('Welcome to VEGU Operations');
      window.location.href = '/';
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    },
  });

  const forgotMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/operations/auth/forgot-password', { identifier });
      return res.data.data as { devResetToken?: string };
    },
    onSuccess: (data) => {
      toast.success('Reset instructions generated');
      if (data?.devResetToken) {
        setResetToken(data.devResetToken);
      }
      setShowReset(true);
    },
    onError: () => toast.error('Unable to generate reset token'),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/operations/auth/reset-password', { token: resetToken, newPassword });
    },
    onSuccess: () => {
      toast.success('Password reset successful');
      setShowReset(false);
      setNewPassword('');
    },
    onError: () => toast.error('Password reset failed'),
  });

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>VEGU Operations System</h1>
        <p>Store staff, managers and support secure login</p>
        <label>Email or Mobile</label>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="staff@vegu.app or mobile" />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
        <button onClick={() => loginMutation.mutate()} disabled={loginMutation.isPending}>Sign In</button>
        <button className="ghost" onClick={() => forgotMutation.mutate()} disabled={forgotMutation.isPending}>Forgot Password</button>

        {showReset && (
          <div className="reset-block">
            <h3>Reset Password</h3>
            <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Reset token" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            <button onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardPage() {
  const user = useMemo(readUser, []);

  const dashboardQuery = useQuery({
    queryKey: ['ops-dashboard'],
    queryFn: async () => (await api.get('/api/operations/dashboard')).data.data,
  });

  const ordersQuery = useQuery({
    queryKey: ['ops-orders'],
    queryFn: async () => (await api.get('/api/operations/orders?limit=20')).data.data,
  });

  const inventoryQuery = useQuery({
    queryKey: ['ops-inventory'],
    queryFn: async () => (await api.get('/api/operations/inventory')).data.data,
  });

  const storesQuery = useQuery({
    queryKey: ['ops-stores'],
    queryFn: async () => (await api.get('/api/operations/stores')).data.data,
  });

  const ridersQuery = useQuery({
    queryKey: ['ops-riders'],
    queryFn: async () => (await api.get('/api/operations/riders')).data.data,
  });

  const vendorsQuery = useQuery({
    queryKey: ['ops-vendors'],
    queryFn: async () => (await api.get('/api/operations/vendors')).data.data,
  });

  const supportQuery = useQuery({
    queryKey: ['ops-support'],
    queryFn: async () => (await api.get('/api/operations/support/tickets')).data.data,
  });

  const updateStage = useMutation({
    mutationFn: async (payload: { orderId: string; stage: string }) => {
      await api.patch(`/api/operations/orders/${payload.orderId}/stage`, { stage: payload.stage });
    },
    onSuccess: () => {
      toast.success('Order stage updated');
      ordersQuery.refetch();
      dashboardQuery.refetch();
    },
    onError: () => toast.error('Stage update failed'),
  });

  const logout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>VEGU OPS</h2>
        <p>{user?.name}</p>
        <p className="muted">{user?.role}</p>
        <p className="muted">{user?.staffProfile?.store?.name || 'Global Access'}</p>
        <button className="ghost" onClick={logout}>Logout</button>
      </aside>

      <main className="main">
        <section className="cards">
          <MetricCard title="Today's Orders" value={dashboardQuery.data?.todayOrders || 0} />
          <MetricCard title="Pending" value={dashboardQuery.data?.pendingOrders || 0} />
          <MetricCard title="Packed" value={dashboardQuery.data?.packedOrders || 0} />
          <MetricCard title="Delivered" value={dashboardQuery.data?.deliveredOrders || 0} />
          <MetricCard title="Cancelled" value={dashboardQuery.data?.cancelledOrders || 0} />
          <MetricCard title="Sales" value={`Rs ${dashboardQuery.data?.todaySales || 0}`} />
          <MetricCard title="Inventory Alerts" value={dashboardQuery.data?.inventoryAlerts || 0} />
        </section>

        <section className="grid2">
          <Panel title="Order Workflow">
            {(ordersQuery.data || []).slice(0, 10).map((order: any) => (
              <div key={order.id} className="row">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <p>{order.user?.name} • {order.opsStage}</p>
                </div>
                <select
                  title="Order stage"
                  value={order.opsStage}
                  onChange={(e) => updateStage.mutate({ orderId: order.id, stage: e.target.value })}
                >
                  {['STORE_RECEIVED', 'STORE_ACCEPTED', 'PACKING_STARTED', 'PACKED', 'BARCODE_GENERATED', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            ))}
          </Panel>

          <Panel title="Inventory Alerts">
            {(inventoryQuery.data || []).filter((p: any) => p.stock <= 10).slice(0, 12).map((product: any) => (
              <div key={product.id} className="row">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.store?.name || 'No store'} • {product.stock} in stock</p>
                </div>
                <span className={product.stock === 0 ? 'badge bad' : 'badge'}>{product.stock === 0 ? 'OUT' : 'LOW'}</span>
              </div>
            ))}
          </Panel>
        </section>

        <section className="grid3">
          <Panel title="Stores">
            {(storesQuery.data || []).map((store: any) => (
              <p key={store.id}>{store.name} ({store.code}) • Staff {store._count.staff}</p>
            ))}
          </Panel>
          <Panel title="Vendors">
            {(vendorsQuery.data || []).slice(0, 8).map((v: any) => (
              <p key={v.id}>{v.storeName} • Products {v._count.products}</p>
            ))}
          </Panel>
          <Panel title="Riders">
            {(ridersQuery.data || []).slice(0, 8).map((r: any) => (
              <p key={r.id}>{r.user?.name} • {r.status} • Orders {r._count.deliveries}</p>
            ))}
          </Panel>
        </section>

        <section>
          <Panel title="Customer Support Queue">
            {(supportQuery.data || []).slice(0, 12).map((t: any) => (
              <div key={t.id} className="row">
                <div>
                  <strong>{t.title}</strong>
                  <p>{t.status} • {t.priority} • {t.user?.name || 'Guest'}</p>
                </div>
                <span className="badge">{t.category}</span>
              </div>
            ))}
          </Panel>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card">
      <p className="muted">{title}</p>
      <h3>{value}</h3>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('vegu_ops_access_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
