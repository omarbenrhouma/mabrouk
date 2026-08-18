import {
  AlertTriangle, ArrowRight, Bell, BriefcaseBusiness, Building2, CalendarDays, Check,
  CheckCircle2, ChevronRight, ClipboardList, Clock3, Fingerprint, History,
  LayoutDashboard, Loader2, LogIn, LogOut, Menu, Plus, RefreshCw, Send,
  ShieldCheck, Sparkles, Store, UserRound, UsersRound, X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type SessionUser = { name: string; role: "ADMIN" | "STORE_MANAGER" | "EMPLOYEE" };
type StoreData = {
  id: string; code: string; name: string; city: string; openingTime: string;
  closingTime: string; targetStaff: number; _count: { employees: number };
};
type Shift = {
  id: string; startsAt: string; endsAt: string; status: string; breakMins: number;
  store: { id: string; code: string; name: string; city?: string };
  employee?: { user: { name: string } };
  attendance?: Attendance | null;
};
type Attendance = {
  id: string; status: string; checkInAt?: string | null; checkOutAt?: string | null;
  store?: { name: string }; shift?: Shift | null;
  employee?: { user: { name: string } };
};
type Employee = {
  id: string; contractType: string; weeklyHours: number; isActive: boolean;
  user: { name: string; email: string; isActive: boolean };
  primaryStore: { name: string; code: string } | null;
  shifts: Array<{ startsAt: string }>;
};
type ChangeRequest = {
  id: string; requestType: string; requestedDate: string; reason: string;
  status: string; reviewComment?: string | null; createdAt: string;
  employee?: { user: { name: string }; primaryStore: { name: string } | null };
};
type AdminDashboard = {
  metrics: { activeStores: number; activeEmployees: number; todayShifts: number; pendingRequests: number; anomalies: number };
  upcomingShifts: Shift[];
};
type EmployeeDashboard = {
  employee: { id: string; contractType: string; weeklyHours: number; primaryStore: { name: string; city: string } | null };
  nextShifts: Shift[]; recentAttendances: Attendance[]; pendingRequests: number;
};
type AppNotification = { id: string; title: string; message: string; type: string; readAt?: string | null; createdAt: string };
type AuditEntry = { id: string; entityType: string; action: string; comment?: string | null; createdAt: string; actor?: { name: string } | null };

const TOKEN_KEY = "ayouta_token";
const USER_KEY = "ayouta_user";
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

async function api<T>(path: string, token?: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    }
  });
  const payload = await response.json().catch(() => ({ error: "Réponse invalide" })) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Erreur ${response.status}`);
  return payload as T;
}

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [user, setUser] = useState<SessionUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) as SessionUser : null;
  });

  function authenticated(accessToken: string, authenticatedUser: SessionUser) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setToken(accessToken);
    setUser(authenticatedUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  }

  if (!token || !user) return <Login onAuthenticated={authenticated} />;
  return user.role === "EMPLOYEE"
    ? <EmployeeWorkspace token={token} user={user} onLogout={logout} />
    : <AdminWorkspace token={token} user={user} onLogout={logout} />;
}

function Login({ onAuthenticated }: { onAuthenticated: (token: string, user: SessionUser) => void }) {
  const [email, setEmail] = useState("admin@ayouta.tn");
  const [password, setPassword] = useState("ChangeMe123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<{ accessToken: string; user: SessionUser }>("/auth/login", undefined, {
        method: "POST", body: JSON.stringify({ email, password })
      });
      onAuthenticated(result.accessToken, result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginStory">
        <div className="logo mabroukLogo"><span>M</span><div><strong>MABROUK</strong><small>People · par Ayouta</small></div></div>
        <div className="storyCopy">
          <span className="overline"><Sparkles size={15} /> L’élégance commence en coulisses</span>
          <h1>Nos équipes.<br />Nos boutiques.<br /><em>Une même énergie.</em></h1>
          <p>L’espace interne Mabrouk qui simplifie les journées, coordonne les équipes de vente et donne à chaque boutique les moyens de réussir.</p>
        </div>
        <div className="storyStats">
          <div><strong>360°</strong><span>Vision réseau</span></div>
          <div><strong>Live</strong><span>Présence terrain</span></div>
          <div><strong>1 clic</strong><span>Pour pointer</span></div>
        </div>
      </section>
      <section className="loginZone">
        <form className="loginCard" onSubmit={submit}>
          <div className="loginHeading">
            <span className="loginIcon"><Fingerprint /></span>
            <div><p className="eyebrow">Espace sécurisé</p><h2>Bon retour parmi nous</h2></div>
          </div>
          <p className="muted">Connectez-vous selon votre rôle pour accéder à votre journée.</p>
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <div className="alert error"><AlertTriangle size={18} />{error}</div>}
          <button className="button primary full" disabled={loading}>
            {loading ? <Loader2 className="spin" /> : <LogIn />} {loading ? "Connexion..." : "Entrer dans Mabrouk People"}
          </button>
          <div className="demoAccounts">
            <button type="button" onClick={() => { setEmail("admin@ayouta.tn"); setPassword("ChangeMe123!"); }}>
              <ShieldCheck /> Démo administrateur
            </button>
            <button type="button" onClick={() => { setEmail("vendeuse@ayouta.tn"); setPassword("ChangeMe123!"); }}>
              <UserRound /> Démo vendeuse
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function AdminWorkspace({ token, user, onLogout }: WorkspaceProps) {
  const [view, setView] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<"store" | "employee" | "shift" | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, storeList, employeeList, requestList, notificationList, auditList] = await Promise.all([
        api<{ data: AdminDashboard }>("/dashboard", token),
        api<{ data: StoreData[] }>("/stores", token),
        api<{ data: Employee[] }>("/employees", token),
        api<{ data: ChangeRequest[] }>("/requests", token),
        api<{ data: AppNotification[] }>("/notifications", token),
        api<{ data: AuditEntry[] }>("/audit-logs?limit=60", token)
      ]);
      setDashboard(dash.data); setStores(storeList.data); setEmployees(employeeList.data); setRequests(requestList.data);
      setNotifications(notificationList.data); setAuditLogs(auditList.data);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Chargement impossible");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    try {
      await api(`/requests/${id}/review`, token, {
        method: "PATCH", body: JSON.stringify({ status, reviewComment: status === "APPROVED" ? "Demande validée" : "Demande refusée" })
      });
      setNotice(status === "APPROVED" ? "Demande approuvée" : "Demande refusée");
      await load();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Action impossible"); }
  }

  const nav = [
    ["dashboard", "Pilotage", LayoutDashboard], ["planning", "Planning", CalendarDays],
    ["team", "Équipe", UsersRound], ["attendance", "Présences", Fingerprint],
    ["requests", "Demandes", ClipboardList], ["stores", "Boutiques", Store], ["audit", "Traçabilité", History]
  ] as const;

  return (
    <div className="appShell">
      <Sidebar nav={nav} view={view} setView={setView} user={user} onLogout={onLogout} open={mobileNav} close={() => setMobileNav(false)} />
      <main className="mainArea">
        <Topbar user={user} onMenu={() => setMobileNav(true)} onRefresh={load} unread={notifications.filter((item) => !item.readAt).length} onNotifications={() => setNotificationOpen((value) => !value)} />
        {notificationOpen && <NotificationPanel notifications={notifications} close={() => setNotificationOpen(false)} />}
        {notice && <Toast message={notice} close={() => setNotice("")} />}
        {loading ? <Loading /> : (
          <>
            {view === "dashboard" && dashboard && <AdminHome data={dashboard} requests={requests} stores={stores} setView={setView} openShift={() => setForm("shift")} />}
            {view === "planning" && <Planning shifts={dashboard?.upcomingShifts ?? []} open={() => setForm("shift")} />}
            {view === "team" && <Team employees={employees} open={() => setForm("employee")} />}
            {view === "attendance" && <AttendanceAdmin shifts={dashboard?.upcomingShifts ?? []} />}
            {view === "requests" && <RequestsAdmin requests={requests} review={review} />}
            {view === "stores" && <Stores stores={stores} open={() => setForm("store")} />}
            {view === "audit" && <AuditTrail entries={auditLogs} />}
          </>
        )}
        {form && <AdminFormModal kind={form} token={token} stores={stores} employees={employees} close={() => setForm(null)} saved={async () => { setForm(null); setNotice("Enregistrement effectué"); await load(); }} />}
      </main>
    </div>
  );
}

function EmployeeWorkspace({ token, user, onLogout }: WorkspaceProps) {
  const [view, setView] = useState("today");
  const [mobileNav, setMobileNav] = useState(false);
  const [dashboard, setDashboard] = useState<EmployeeDashboard | null>(null);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, requestList, notificationList] = await Promise.all([
        api<{ data: EmployeeDashboard }>("/dashboard", token),
        api<{ data: ChangeRequest[] }>("/requests", token),
        api<{ data: AppNotification[] }>("/notifications", token)
      ]);
      setDashboard(dash.data); setRequests(requestList.data);
      setNotifications(notificationList.data);
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Chargement impossible"); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function punch(kind: "check-in" | "check-out", shiftId: string) {
    try {
      await api(`/attendances/${kind}`, token, { method: "POST", body: JSON.stringify({ shiftId }) });
      setNotice(kind === "check-in" ? "Arrivée enregistrée. Bonne journée !" : "Départ enregistré. À bientôt !");
      await load();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Pointage impossible"); }
  }

  const nav = [
    ["today", "Ma journée", Sparkles], ["schedule", "Mon planning", CalendarDays],
    ["attendance", "Mes présences", Fingerprint], ["requests", "Mes demandes", ClipboardList]
  ] as const;

  return (
    <div className="appShell employeeTheme">
      <Sidebar nav={nav} view={view} setView={setView} user={user} onLogout={onLogout} open={mobileNav} close={() => setMobileNav(false)} />
      <main className="mainArea">
        <Topbar user={user} onMenu={() => setMobileNav(true)} onRefresh={load} unread={notifications.filter((item) => !item.readAt).length} onNotifications={() => setNotificationOpen((value) => !value)} />
        {notificationOpen && <NotificationPanel notifications={notifications} close={() => setNotificationOpen(false)} />}
        {notice && <Toast message={notice} close={() => setNotice("")} />}
        {loading || !dashboard ? <Loading /> : (
          <>
            {view === "today" && <EmployeeHome data={dashboard} punch={punch} openRequest={() => setRequestOpen(true)} />}
            {view === "schedule" && <EmployeeSchedule shifts={dashboard.nextShifts} />}
            {view === "attendance" && <AttendanceEmployee entries={dashboard.recentAttendances} />}
            {view === "requests" && <EmployeeRequests requests={requests} open={() => setRequestOpen(true)} />}
          </>
        )}
        {requestOpen && <RequestModal token={token} close={() => setRequestOpen(false)} saved={async () => { setRequestOpen(false); await load(); }} />}
      </main>
    </div>
  );
}

type WorkspaceProps = { token: string; user: SessionUser; onLogout: () => void };

function Sidebar({ nav, view, setView, user, onLogout, open, close }: {
  nav: readonly (readonly [string, string, LucideIcon])[];
  view: string; setView: (value: string) => void; user: SessionUser; onLogout: () => void; open: boolean; close: () => void;
}) {
  return (
    <>
      {open && <button className="navOverlay" onClick={close} aria-label="Fermer le menu" />}
      <aside className={`side ${open ? "open" : ""}`}>
        <div className="logo mabroukLogo"><span>M</span><div><strong>MABROUK</strong><small>People · par Ayouta</small></div></div>
        <nav>{nav.map(([id, label, Icon]) => (
          <button className={view === id ? "active" : ""} key={id} onClick={() => { setView(id); close(); }}>
            <Icon size={19} /><span>{label}</span>{view === id && <ChevronRight size={16} />}
          </button>
        ))}</nav>
        <div className="sideProfile">
          <div className="avatar">{initials(user.name)}</div>
          <div><strong>{user.name}</strong><small>{roleLabel(user.role)}</small></div>
          <button onClick={onLogout} title="Déconnexion"><LogOut size={18} /></button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ user, onMenu, onRefresh, unread, onNotifications }: { user: SessionUser; onMenu: () => void; onRefresh: () => void; unread: number; onNotifications: () => void }) {
  return (
    <header className="topbar">
      <button className="menuButton" onClick={onMenu}><Menu /></button>
      <div><p>{formatLongDate(new Date())}</p><strong>Bonjour, {user.name.split(" ")[0]} 👋</strong></div>
      <div className="topActions"><button className="iconButton notificationButton" onClick={onNotifications} title="Notifications"><Bell size={18} />{unread > 0 && <span>{unread}</span>}</button><button className="iconButton" onClick={onRefresh} title="Actualiser"><RefreshCw size={18} /></button></div>
    </header>
  );
}

function AdminHome({ data, requests, stores, setView, openShift }: {
  data: AdminDashboard; requests: ChangeRequest[]; stores: StoreData[]; setView: (view: string) => void; openShift: () => void;
}) {
  const metrics = [
    ["Collaborateurs", data.metrics.activeEmployees, "Équipe active", UsersRound, "gold"],
    ["Boutiques", data.metrics.activeStores, "Réseau opérationnel", Building2, "cyan"],
    ["Shifts aujourd’hui", data.metrics.todayShifts, "Planifiés", CalendarDays, "amber"],
    ["Demandes", data.metrics.pendingRequests, "À traiter", ClipboardList, "rose"]
  ] as const;
  return (
    <Page title="Cockpit réseau" subtitle="La situation de vos boutiques, en un coup d’œil." action={<button className="button primary" onClick={openShift}><Plus /> Nouveau shift</button>}>
      <div className="metrics">{metrics.map(([label, value, note, Icon, tone]) => (
        <article className={`metric ${tone}`} key={label}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>
      ))}</div>
      <div className="dashboardGrid">
        <section className="card span2">
          <CardTitle icon={<CalendarDays />} title="Rythme des 7 prochains jours" subtitle={`${data.upcomingShifts.length} shifts visibles`} action="Planning complet" onAction={() => setView("planning")} />
          <ShiftTimeline shifts={data.upcomingShifts.slice(0, 8)} />
        </section>
        <section className="card">
          <CardTitle icon={<AlertTriangle />} title="À votre attention" subtitle="Actions prioritaires" />
          <div className="attentionList">
            <Attention tone="rose" value={data.metrics.pendingRequests} label="demandes en attente" onClick={() => setView("requests")} />
            <Attention tone="amber" value={data.metrics.anomalies} label="anomalies de présence" onClick={() => setView("attendance")} />
            <Attention tone="cyan" value={stores.filter((s) => s._count.employees < s.targetStaff).length} label="boutiques sous l’objectif" onClick={() => setView("stores")} />
          </div>
        </section>
        <section className="card">
          <CardTitle icon={<Store />} title="Santé des boutiques" subtitle="Couverture des effectifs" />
          <div className="storePulse">{stores.map((store) => {
            const percent = Math.min(100, Math.round(store._count.employees / store.targetStaff * 100));
            return <div key={store.id}><div><strong>{store.name}</strong><span>{store._count.employees}/{store.targetStaff}</span></div><Progress value={percent} /></div>;
          })}</div>
        </section>
        <section className="card span2">
          <CardTitle icon={<ClipboardList />} title="Dernières demandes" subtitle="Décisions à prendre" action="Tout voir" onAction={() => setView("requests")} />
          <RequestRows requests={requests.slice(0, 4)} />
        </section>
      </div>
    </Page>
  );
}

function EmployeeHome({ data, punch, openRequest }: {
  data: EmployeeDashboard; punch: (kind: "check-in" | "check-out", id: string) => void; openRequest: () => void;
}) {
  const today = data.nextShifts.find((shift) => sameDay(new Date(shift.startsAt), new Date()));
  const checkedIn = Boolean(today?.attendance?.checkInAt);
  const checkedOut = Boolean(today?.attendance?.checkOutAt);
  return (
    <Page title="Ma journée" subtitle={`${data.employee.primaryStore?.name ?? "Boutique"} · ${formatLongDate(new Date())}`}>
      <section className="employeeHero">
        <div className="heroPattern"></div>
        <div className="todayCopy">
          <span className="overline light"><Sparkles size={15} /> Votre prochain temps fort</span>
          {today ? <>
            <h2>{time(today.startsAt)} — {time(today.endsAt)}</h2>
            <p><Store size={18} /> {today.store.name} · Pause {today.breakMins} min</p>
            <div className="punchActions">
              {!checkedIn && <button className="button white" onClick={() => punch("check-in", today.id)}><Fingerprint /> Pointer mon arrivée</button>}
              {checkedIn && !checkedOut && <button className="button white" onClick={() => punch("check-out", today.id)}><LogOut /> Pointer mon départ</button>}
              {checkedOut && <span className="completed"><CheckCircle2 /> Journée pointée</span>}
              <button className="button ghostLight" onClick={openRequest}><Send /> Faire une demande</button>
            </div>
          </> : <><h2>Aucun shift aujourd’hui</h2><p>Profitez de votre journée de repos.</p></>}
        </div>
        <div className="timeOrb"><Clock3 /><strong>{currentTime()}</strong><span>Heure locale</span></div>
      </section>
      <div className="employeeStats">
        <article><CalendarDays /><div><strong>{data.nextShifts.length}</strong><span>Shifts à venir</span></div></article>
        <article><BriefcaseBusiness /><div><strong>{data.employee.weeklyHours}h</strong><span>Contrat hebdo.</span></div></article>
        <article><ClipboardList /><div><strong>{data.pendingRequests}</strong><span>Demandes ouvertes</span></div></article>
      </div>
      <div className="dashboardGrid employeeGrid">
        <section className="card span2"><CardTitle icon={<CalendarDays />} title="Ma semaine" subtitle="Planning publié" /><EmployeeWeek shifts={data.nextShifts} /></section>
        <section className="card"><CardTitle icon={<History />} title="Derniers pointages" subtitle="Votre historique" /><AttendanceCompact entries={data.recentAttendances} /></section>
      </div>
    </Page>
  );
}

function Planning({ shifts, open }: { shifts: Shift[]; open: () => void }) {
  const grouped = useMemo(() => shifts.reduce<Record<string, Shift[]>>((result, shift) => {
    const date = new Date(shift.startsAt).toISOString().slice(0, 10);
    (result[date] ??= []).push(shift);
    return result;
  }, {}), [shifts]);
  return <Page title="Planning réseau" subtitle="Les affectations publiées pour les 7 prochains jours." action={<button className="button primary" onClick={open}><Plus /> Créer un shift</button>}>
    <section className="card"><div className="calendarGrid">{Object.entries(grouped).map(([date, list]) => (
      <div className="calendarDay" key={date}><header><span>{shortDay(new Date(date))}</span><strong>{new Date(date).getDate()}</strong></header>
        <div>{list?.map((shift) => <article key={shift.id}><span className="shiftTime">{time(shift.startsAt)}</span><strong>{shift.employee?.user.name}</strong><small>{shift.store.name}</small></article>)}</div>
      </div>
    ))}</div>{shifts.length === 0 && <Empty icon={<CalendarDays />} text="Aucun shift planifié." />}</section>
  </Page>;
}

function Team({ employees, open }: { employees: Employee[]; open: () => void }) {
  return <Page title="Équipe de vente" subtitle={`${employees.length} collaborateurs actifs dans le réseau.`} action={<button className="button primary" onClick={open}><Plus /> Ajouter un vendeur</button>}>
    <section className="card tableCard"><div className="dataTable teamTable"><div className="tableHead"><span>Collaborateur</span><span>Boutique</span><span>Contrat</span><span>Prochain shift</span><span>Statut</span></div>
      {employees.map((employee) => <div className="tableRow" key={employee.id}>
        <span className="person"><i>{initials(employee.user.name)}</i><span><strong>{employee.user.name}</strong><small>{employee.user.email}</small></span></span>
        <span>{employee.primaryStore?.name ?? "Non affecté"}</span><span>{contractLabel(employee.contractType)} · {employee.weeklyHours}h</span>
        <span>{employee.shifts[0] ? formatShortDate(new Date(employee.shifts[0].startsAt)) : "À planifier"}</span>
        <span><Badge status={employee.isActive ? "ACTIVE" : "INACTIVE"} /></span>
      </div>)}</div></section>
  </Page>;
}

function AttendanceAdmin({ shifts }: { shifts: Shift[] }) {
  const today = shifts.filter((shift) => sameDay(new Date(shift.startsAt), new Date()));
  return <Page title="Présences du jour" subtitle="Suivez les arrivées et détectez les anomalies terrain.">
    <section className="card tableCard"><div className="dataTable attendanceTable"><div className="tableHead"><span>Employé</span><span>Boutique</span><span>Shift</span><span>Arrivée</span><span>Départ</span><span>État</span></div>
      {today.map((shift) => <div className="tableRow" key={shift.id}><span className="person"><i>{initials(shift.employee?.user.name ?? "?")}</i><strong>{shift.employee?.user.name}</strong></span><span>{shift.store.name}</span><span>{time(shift.startsAt)}–{time(shift.endsAt)}</span><span>{shift.attendance?.checkInAt ? time(shift.attendance.checkInAt) : "—"}</span><span>{shift.attendance?.checkOutAt ? time(shift.attendance.checkOutAt) : "—"}</span><span><Badge status={shift.attendance?.status ?? "EXPECTED"} /></span></div>)}
    </div>{today.length === 0 && <Empty icon={<Fingerprint />} text="Aucun shift prévu aujourd’hui." />}</section>
  </Page>;
}

function RequestsAdmin({ requests, review }: { requests: ChangeRequest[]; review: (id: string, status: "APPROVED" | "REJECTED") => void }) {
  return <Page title="Demandes collaborateurs" subtitle="Arbitrez les absences, échanges et changements de shift.">
    <section className="requestGrid">{requests.map((request) => <article className="requestCard" key={request.id}>
      <div className="requestTop"><span className="person"><i>{initials(request.employee?.user.name ?? "?")}</i><span><strong>{request.employee?.user.name}</strong><small>{request.employee?.primaryStore?.name}</small></span></span><Badge status={request.status} /></div>
      <span className="requestType">{requestLabel(request.requestType)}</span><h3>{formatShortDate(new Date(request.requestedDate))}</h3><p>{request.reason}</p>
      {request.status === "PENDING" && <div className="reviewActions"><button className="button approve" onClick={() => review(request.id, "APPROVED")}><Check /> Approuver</button><button className="button reject" onClick={() => review(request.id, "REJECTED")}><X /> Refuser</button></div>}
    </article>)}</section>{requests.length === 0 && <Empty icon={<ClipboardList />} text="Aucune demande pour le moment." />}
  </Page>;
}

function Stores({ stores, open }: { stores: StoreData[]; open: () => void }) {
  return <Page title="Réseau boutiques" subtitle="Capacité, amplitude et couverture de chaque point de vente." action={<button className="button primary" onClick={open}><Plus /> Ajouter une boutique</button>}>
    <div className="storeGrid">{stores.map((store) => {
      const percent = Math.min(100, Math.round(store._count.employees / store.targetStaff * 100));
      return <article className="storeCard" key={store.id}><div className="storeVisual"><Store /><span>{store.code}</span></div><div className="storeBody"><small>{store.city}</small><h3>{store.name}</h3><p><Clock3 /> {store.openingTime} — {store.closingTime}</p><div className="storeCapacity"><div><span>Effectif</span><strong>{store._count.employees}/{store.targetStaff}</strong></div><Progress value={percent} /></div></div></article>;
    })}</div>
  </Page>;
}

function EmployeeSchedule({ shifts }: { shifts: Shift[] }) {
  return <Page title="Mon planning" subtitle="Vos prochains shifts publiés.">
    <div className="scheduleList">{shifts.map((shift, index) => <article key={shift.id} className={sameDay(new Date(shift.startsAt), new Date()) ? "current" : ""}>
      <div className="dateTile"><span>{shortDay(new Date(shift.startsAt))}</span><strong>{new Date(shift.startsAt).getDate()}</strong><small>{month(new Date(shift.startsAt))}</small></div>
      <div className="scheduleLine"></div><div className="scheduleInfo"><span>{index === 0 ? "Prochain shift" : "Shift publié"}</span><h3>{time(shift.startsAt)} — {time(shift.endsAt)}</h3><p><Store /> {shift.store.name} · Pause {shift.breakMins} min</p></div><Badge status={shift.status} />
    </article>)}</div>
  </Page>;
}

function AttendanceEmployee({ entries }: { entries: Attendance[] }) {
  return <Page title="Mes présences" subtitle="Historique personnel de vos arrivées et départs.">
    <section className="card"><div className="attendanceHistory">{entries.map((entry) => <article key={entry.id}><span className="historyIcon"><Fingerprint /></span><div><strong>{entry.store?.name}</strong><small>{entry.checkInAt ? formatShortDate(new Date(entry.checkInAt)) : "Date indisponible"}</small></div><div className="historyTimes"><span>Arrivée <strong>{entry.checkInAt ? time(entry.checkInAt) : "—"}</strong></span><span>Départ <strong>{entry.checkOutAt ? time(entry.checkOutAt) : "—"}</strong></span></div><Badge status={entry.status} /></article>)}</div>{entries.length === 0 && <Empty icon={<History />} text="Aucun pointage enregistré." />}</section>
  </Page>;
}

function EmployeeRequests({ requests, open }: { requests: ChangeRequest[]; open: () => void }) {
  return <Page title="Mes demandes" subtitle="Suivez vos demandes et leurs décisions." action={<button className="button primary" onClick={open}><Plus /> Nouvelle demande</button>}>
    <section className="card"><div className="myRequests">{requests.map((request) => <article key={request.id}><span className="requestIcon"><Send /></span><div><small>{requestLabel(request.requestType)}</small><strong>{formatShortDate(new Date(request.requestedDate))}</strong><p>{request.reason}</p></div><Badge status={request.status} /></article>)}</div>{requests.length === 0 && <Empty icon={<Send />} text="Vous n’avez envoyé aucune demande." />}</section>
  </Page>;
}

function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  return <Page title="Traçabilité" subtitle="Les opérations sensibles, classées de la plus récente à la plus ancienne.">
    <section className="card auditCard">
      <div className="auditList">{entries.map((entry) => <article key={entry.id}>
        <time>{formatShortDate(new Date(entry.createdAt))}<small>{time(entry.createdAt)}</small></time>
        <span className="auditMark"></span>
        <div><strong>{actionLabel(entry.action)}</strong><p>{entityLabel(entry.entityType)}{entry.comment ? ` · ${entry.comment}` : ""}</p><small>par {entry.actor?.name ?? "Système"}</small></div>
      </article>)}</div>
      {entries.length === 0 && <Empty icon={<History />} text="Aucune action enregistrée." />}
    </section>
  </Page>;
}

function NotificationPanel({ notifications, close }: { notifications: AppNotification[]; close: () => void }) {
  return <aside className="notificationPanel">
    <header><div><p className="eyebrow">Centre d’activité</p><h2>Notifications</h2></div><button onClick={close}><X /></button></header>
    <div>{notifications.map((item) => <article className={!item.readAt ? "unread" : ""} key={item.id}>
      <span className="notificationDot"></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{relativeDate(new Date(item.createdAt))}</small></div>
    </article>)}</div>
    {notifications.length === 0 && <Empty icon={<Bell />} text="Vous êtes à jour." />}
  </aside>;
}

function AdminFormModal({ kind, token, stores, employees, close, saved }: {
  kind: "store" | "employee" | "shift"; token: string; stores: StoreData[]; employees: Employee[]; close: () => void; saved: () => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const titles = { store: "Nouvelle boutique", employee: "Nouveau collaborateur", shift: "Nouveau shift" };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (kind === "store") {
        await api("/stores", token, { method: "POST", body: JSON.stringify({
          code: form.get("code"), name: form.get("name"), address: form.get("address"), city: form.get("city"),
          openingTime: form.get("openingTime"), closingTime: form.get("closingTime"), targetStaff: Number(form.get("targetStaff"))
        }) });
      } else if (kind === "employee") {
        await api("/employees", token, { method: "POST", body: JSON.stringify({
          name: form.get("name"), email: form.get("email"), password: form.get("password"), phone: form.get("phone") || undefined,
          contractType: form.get("contractType"), weeklyHours: Number(form.get("weeklyHours")), jobTitle: form.get("jobTitle"),
          hireDate: `${form.get("hireDate")}T12:00:00`, primaryStoreId: form.get("primaryStoreId")
        }) });
      } else {
        const date = String(form.get("date"));
        const created = await api<{ data: { id: string } }>("/shifts", token, { method: "POST", body: JSON.stringify({
          employeeId: form.get("employeeId"), storeId: form.get("storeId"),
          startsAt: `${date}T${form.get("startTime")}:00`, endsAt: `${date}T${form.get("endTime")}:00`,
          breakMins: Number(form.get("breakMins")), position: form.get("position")
        }) });
        if (form.get("publish") === "on") await api(`/shifts/${created.data.id}/publish`, token, { method: "POST" });
      }
      await saved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Enregistrement impossible"); }
    finally { setLoading(false); }
  }

  return <div className="modalBackdrop"><form className="modal adminModal" onSubmit={submit}>
    <div className="modalHead"><div><p className="eyebrow">Gestion opérationnelle</p><h2>{titles[kind]}</h2></div><button type="button" onClick={close}><X /></button></div>
    {kind === "store" && <div className="formGrid">
      <label>Code<input name="code" placeholder="BTQ-004" required /></label><label>Nom<input name="name" placeholder="Mall of Sousse" required /></label>
      <label className="wideField">Adresse<input name="address" placeholder="Adresse complète" required /></label><label>Ville<input name="city" placeholder="Sousse" required /></label>
      <label>Effectif cible<input name="targetStaff" type="number" min="1" defaultValue="8" required /></label>
      <label>Ouverture<input name="openingTime" type="time" defaultValue="09:00" required /></label><label>Fermeture<input name="closingTime" type="time" defaultValue="21:00" required /></label>
    </div>}
    {kind === "employee" && <div className="formGrid">
      <label>Nom complet<input name="name" placeholder="Prénom Nom" required /></label><label>Email<input name="email" type="email" placeholder="vendeur@ayouta.tn" required /></label>
      <label>Mot de passe initial<input name="password" type="password" minLength={8} defaultValue="ChangeMe123!" required /></label><label>Téléphone<input name="phone" placeholder="+216 ..." /></label>
      <label>Contrat<select name="contractType"><option value="CDI">CDI</option><option value="CDD">CDD</option><option value="PART_TIME">Temps partiel</option><option value="SEASONAL">Saisonnier</option><option value="INTERN">Stage</option></select></label>
      <label>Heures/semaine<input name="weeklyHours" type="number" min="1" max="60" defaultValue="40" required /></label>
      <label>Poste<input name="jobTitle" defaultValue="Vendeur" required /></label><label>Date d’embauche<input name="hireDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
      <label className="wideField">Boutique principale<select name="primaryStoreId" required>{stores.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select></label>
    </div>}
    {kind === "shift" && <div className="formGrid">
      <label className="wideField">Collaborateur<select name="employeeId" required>{employees.filter((employee) => employee.isActive).map((employee) => <option value={employee.id} key={employee.id}>{employee.user.name}</option>)}</select></label>
      <label className="wideField">Boutique<select name="storeId" required>{stores.map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select></label>
      <label>Date<input name="date" type="date" defaultValue={tomorrow} required /></label><label>Poste<input name="position" defaultValue="Vente" required /></label>
      <label>Début<input name="startTime" type="time" defaultValue="09:00" required /></label><label>Fin<input name="endTime" type="time" defaultValue="17:00" required /></label>
      <label>Pause (minutes)<input name="breakMins" type="number" min="0" max="240" defaultValue="45" /></label>
      <label className="checkLabel"><input name="publish" type="checkbox" defaultChecked /> Publier et notifier</label>
    </div>}
    {error && <div className="alert error"><AlertTriangle />{error}</div>}
    <div className="modalActions"><button type="button" className="button secondary" onClick={close}>Annuler</button><button className="button primary" disabled={loading}>{loading ? <Loader2 className="spin" /> : <Check />} Enregistrer</button></div>
  </form></div>;
}

function RequestModal({ token, close, saved }: { token: string; close: () => void; saved: () => void }) {
  const [type, setType] = useState("SHIFT_CHANGE");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      await api("/requests", token, { method: "POST", body: JSON.stringify({ requestType: type, requestedDate: `${date}T12:00:00`, reason }) });
      await saved();
    } catch (reasonValue) { setError(reasonValue instanceof Error ? reasonValue.message : "Envoi impossible"); }
    finally { setLoading(false); }
  }
  return <div className="modalBackdrop"><form className="modal" onSubmit={submit}><div className="modalHead"><div><p className="eyebrow">Nouvelle demande</p><h2>Parlons de votre planning</h2></div><button type="button" onClick={close}><X /></button></div>
    <label>Type<select value={type} onChange={(e) => setType(e.target.value)}><option value="SHIFT_CHANGE">Changer de shift</option><option value="ABSENCE">Demander une absence</option><option value="REPLACEMENT">Proposer un remplacement</option></select></label>
    <label>Date souhaitée<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
    <label>Expliquez votre demande<textarea value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} placeholder="Précisez le contexte pour aider votre responsable..." required /></label>
    {error && <div className="alert error">{error}</div>}<div className="modalActions"><button type="button" className="button secondary" onClick={close}>Annuler</button><button className="button primary" disabled={loading}><Send /> Envoyer</button></div>
  </form></div>;
}

function Page({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="page"><div className="pageHead"><div><p className="eyebrow">Mabrouk · retail people</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>{children}</div>;
}
function CardTitle({ icon, title, subtitle, action, onAction }: { icon: React.ReactNode; title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="cardTitle"><span>{icon}</span><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <button onClick={onAction}>{action}<ArrowRight size={15} /></button>}</div>;
}
function ShiftTimeline({ shifts }: { shifts: Shift[] }) {
  return <div className="shiftTimeline">{shifts.map((shift) => <article key={shift.id}><div className="timelineDate"><strong>{shortDay(new Date(shift.startsAt))}</strong><span>{new Date(shift.startsAt).getDate()}</span></div><div className="timelineBar"></div><div><strong>{shift.employee?.user.name}</strong><small>{shift.store.name} · {time(shift.startsAt)}–{time(shift.endsAt)}</small></div><Badge status={shift.attendance?.status ?? shift.status} /></article>)}</div>;
}
function EmployeeWeek({ shifts }: { shifts: Shift[] }) {
  return <div className="employeeWeek">{Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() + i); const shift = shifts.find((item) => sameDay(new Date(item.startsAt), date)); return <article className={i === 0 ? "today" : ""} key={date.toISOString()}><span>{shortDay(date)}</span><strong>{date.getDate()}</strong>{shift ? <><i></i><small>{time(shift.startsAt)}</small></> : <small>Repos</small>}</article>; })}</div>;
}
function AttendanceCompact({ entries }: { entries: Attendance[] }) {
  return <div className="compactList">{entries.slice(0, 4).map((entry) => <article key={entry.id}><span><CheckCircle2 /></span><div><strong>{entry.store?.name}</strong><small>{entry.checkInAt ? formatShortDate(new Date(entry.checkInAt)) : "—"}</small></div><Badge status={entry.status} /></article>)}{entries.length === 0 && <p className="muted">Pas encore de pointage.</p>}</div>;
}
function RequestRows({ requests }: { requests: ChangeRequest[] }) {
  return <div className="requestRows">{requests.map((request) => <article key={request.id}><span className="person"><i>{initials(request.employee?.user.name ?? "?")}</i><span><strong>{request.employee?.user.name}</strong><small>{requestLabel(request.requestType)}</small></span></span><span>{formatShortDate(new Date(request.requestedDate))}</span><Badge status={request.status} /></article>)}{requests.length === 0 && <p className="muted">Aucune demande récente.</p>}</div>;
}
function Attention({ tone, value, label, onClick }: { tone: string; value: number; label: string; onClick: () => void }) {
  return <button className={tone} onClick={onClick}><strong>{value}</strong><span>{label}</span><ChevronRight /></button>;
}
function Progress({ value }: { value: number }) { return <div className="progress"><span style={{ width: `${value}%` }}></span></div>; }
function Toast({ message, close }: { message: string; close: () => void }) { return <div className="toast"><CheckCircle2 />{message}<button onClick={close}><X /></button></div>; }
function Loading() { return <div className="loading"><Loader2 className="spin" /><strong>Préparation de votre espace...</strong></div>; }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="empty"><span>{icon}</span><p>{text}</p></div>; }
function Badge({ status }: { status: string }) {
  const labels: Record<string, string> = { ACTIVE: "Actif", INACTIVE: "Inactif", PENDING: "En attente", APPROVED: "Approuvée", REJECTED: "Refusée", CANCELLED: "Annulé", PUBLISHED: "Publié", EXPECTED: "À venir", PRESENT: "Présent", LATE: "Retard", ABSENT: "Absent", LEFT_EARLY: "Départ anticipé", CORRECTED: "Corrigé" };
  return <span className={`badge ${status.toLowerCase()}`}>{labels[status] ?? status}</span>;
}

function initials(name: string) { return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
function roleLabel(role: string) { return role === "ADMIN" ? "Administrateur réseau" : role === "STORE_MANAGER" ? "Responsable boutique" : "Équipe de vente"; }
function requestLabel(type: string) { return ({ ABSENCE: "Demande d’absence", SHIFT_CHANGE: "Changement de shift", REPLACEMENT: "Proposition de remplacement" } as Record<string, string>)[type] ?? type; }
function contractLabel(type: string) { return ({ PART_TIME: "Temps partiel", SEASONAL: "Saisonnier", INTERN: "Stage" } as Record<string, string>)[type] ?? type; }
function time(value: string) { return new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function currentTime() { return new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit" }).format(new Date()); }
function shortDay(date: Date) { return new Intl.DateTimeFormat("fr-TN", { weekday: "short" }).format(date).replace(".", ""); }
function month(date: Date) { return new Intl.DateTimeFormat("fr-TN", { month: "short" }).format(date).replace(".", ""); }
function formatShortDate(date: Date) { return new Intl.DateTimeFormat("fr-TN", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function formatLongDate(date: Date) { return new Intl.DateTimeFormat("fr-TN", { weekday: "long", day: "numeric", month: "long" }).format(date); }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function actionLabel(action: string) { return ({ CREATE: "Création", UPDATE: "Mise à jour", DEACTIVATE: "Désactivation", PUBLISH: "Publication", CANCEL: "Annulation", CHECK_IN: "Pointage d’arrivée", CHECK_OUT: "Pointage de départ", CORRECT: "Correction de présence", REVIEW: "Décision sur une demande", SEED_REFRESH: "Actualisation des données de démonstration" } as Record<string, string>)[action] ?? action; }
function entityLabel(entity: string) { return ({ Store: "Boutique", EmployeeProfile: "Collaborateur", ScheduleShift: "Shift", Attendance: "Présence", ChangeRequest: "Demande", Assignment: "Affectation", DemoDataset: "Environnement de démonstration" } as Record<string, string>)[entity] ?? entity; }
function relativeDate(date: Date) { const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000)); return minutes < 1 ? "À l’instant" : minutes < 60 ? `Il y a ${minutes} min` : minutes < 1440 ? `Il y a ${Math.floor(minutes / 60)} h` : formatShortDate(date); }
