import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User
} from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import logoUrl from "../images/logo.png";
import { demoCleaners, demoJobs, demoRequests, services } from "./data";
import { auth, db, firebaseReady, OWNER_EMAIL, storage } from "./firebase";
import type {
  CleanerProfile,
  CleaningJob,
  JobStatus,
  RequestStatus,
  ServiceRequest
} from "./types";

type View = "home" | "auth" | "owner" | "cleaner";

type ActiveUser = {
  uid: string;
  email: string;
  displayName: string | null;
};

type RequestDraft = Omit<ServiceRequest, "id" | "status" | "createdAt">;
type JobDraft = Omit<
  CleaningJob,
  | "id"
  | "status"
  | "acceptedBy"
  | "acceptedByName"
  | "acceptedByPhone"
  | "acceptedAt"
  | "startedAt"
  | "finishedAt"
  | "createdAt"
>;

type CleanerDraft = Omit<CleanerProfile, "id" | "createdAt" | "status"> & {
  password: string;
};

const requestStatusLabels: Record<RequestStatus, string> = {
  new: "Nuevo",
  quoted: "Cotizado",
  confirmed: "Confirmado",
  closed: "Cerrado"
};

const jobStatusLabels: Record<JobStatus, string> = {
  available: "Disponible",
  scheduled: "Agendado",
  in_progress: "En Proceso",
  finished: "Finalizado"
};

const initialRequest: RequestDraft = {
  serviceType: services[0].title,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  propertyType: "Apartamento en edificio",
  preferredDate: "",
  preferredTime: "",
  address: "",
  wazeUrl: "",
  apartment: "",
  entryInstructions: "",
  cleaningInstructions: "",
  notes: "",
  assignedJobId: ""
};

const initialJob: JobDraft = {
  serviceType: services[0].title,
  customerName: "",
  customerPhone: "",
  wazeUrl: "",
  address: "",
  apartment: "",
  entryInstructions: "",
  cleaningInstructions: "",
  scheduledDate: "",
  startTime: "",
  endTime: "",
  estimatedHours: 4,
  payRate: 3500,
  notes: "",
  requestId: ""
};

const initialCleaner: CleanerDraft = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  nationalId: "",
  districts: "Rohrmoser, Pavas",
  experience: "",
  availability: "",
  hourlyRate: "3500",
  cvUrl: "",
  cvName: ""
};

const currencyFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0
});

function makeId(prefix: string) {
  if ("randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseReady);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

function useLiveCollection<T extends { id: string }>(
  name: string,
  enabled: boolean
) {
  const [items, setItems] = useState<T[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !db) {
      return;
    }

    return onSnapshot(
      collection(db, name),
      (snapshot) => {
        setItems(
          snapshot.docs.map(
            (item) => ({ id: item.id, ...item.data() }) as T
          )
        );
        setError("");
      },
      (firestoreError) => setError(firestoreError.message)
    );
  }, [enabled, name]);

  return { items, error };
}

export function App() {
  const { user: firebaseUser, loading } = useFirebaseUser();
  const [demoUser, setDemoUser] = useState<ActiveUser | null>(null);
  const activeUser: ActiveUser | null = firebaseUser
    ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName
      }
    : demoUser;
  const [view, setView] = useState<View>("home");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [localRequests, setLocalRequests] =
    useState<ServiceRequest[]>(demoRequests);
  const [localJobs, setLocalJobs] = useState<CleaningJob[]>(demoJobs);
  const [localCleaners, setLocalCleaners] =
    useState<CleanerProfile[]>(demoCleaners);

  const requestsLive = useLiveCollection<ServiceRequest>(
    "serviceRequests",
    firebaseReady
  );
  const jobsLive = useLiveCollection<CleaningJob>("jobs", firebaseReady);
  const cleanersLive = useLiveCollection<CleanerProfile>(
    "cleaners",
    firebaseReady
  );

  const requests = firebaseReady ? requestsLive.items : localRequests;
  const jobs = firebaseReady ? jobsLive.items : localJobs;
  const cleaners = firebaseReady ? cleanersLive.items : localCleaners;
  const isOwner =
    activeUser?.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const activeCleaner = cleaners.find(
    (cleaner) =>
      cleaner.id === activeUser?.uid ||
      cleaner.email.toLowerCase() === activeUser?.email.toLowerCase()
  );

  const collectionErrors = [
    requestsLive.error,
    jobsLive.error,
    cleanersLive.error
  ].filter(Boolean);

  useEffect(() => {
    if (!activeUser) {
      return;
    }

    setView(isOwner ? "owner" : "cleaner");
  }, [activeUser, isOwner]);

  async function submitServiceRequest(draft: RequestDraft) {
    setBusy(true);
    setNotice("");

    try {
      if (db) {
        await addDoc(collection(db, "serviceRequests"), {
          ...draft,
          status: "new",
          createdAt: serverTimestamp()
        });
      } else {
        setLocalRequests((items) => [
          {
            id: makeId("request"),
            ...draft,
            status: "new"
          },
          ...items
        ]);
      }

      setNotice(
        "Pedido recibido. Rocio podra revisar la direccion de Waze y coordinar el servicio."
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el pedido."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    setBusy(true);
    setNotice("");

    try {
      if (auth) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const normalizedEmail = email.toLowerCase();
        const matchedCleaner = localCleaners.find(
          (cleaner) => cleaner.email.toLowerCase() === normalizedEmail
        );
        setDemoUser({
          uid:
            normalizedEmail === OWNER_EMAIL.toLowerCase()
              ? "demo-owner"
              : matchedCleaner?.id ?? makeId("demo-user"),
          email: normalizedEmail,
          displayName:
            normalizedEmail === OWNER_EMAIL.toLowerCase()
              ? "Rocio"
              : matchedCleaner?.fullName ?? "Colaboradora"
        });
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesion."
      );
    } finally {
      setBusy(false);
    }
  }

  async function registerCleaner(draft: CleanerDraft, cvFile: File | null) {
    setBusy(true);
    setNotice("");

    try {
      if (auth && db) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          draft.email,
          draft.password
        );
        await updateProfile(credential.user, {
          displayName: draft.fullName
        });

        let cvUrl = "";
        let cvName = "";

        if (storage && cvFile) {
          const safeName = cvFile.name.replace(/[^\w.-]/g, "_");
          const cvRef = ref(
            storage,
            `cleaner-cvs/${credential.user.uid}/${Date.now()}-${safeName}`
          );
          await uploadBytes(cvRef, cvFile);
          cvUrl = await getDownloadURL(cvRef);
          cvName = cvFile.name;
        }

        await setDoc(doc(db, "cleaners", credential.user.uid), {
          fullName: draft.fullName,
          email: draft.email.toLowerCase(),
          phone: draft.phone,
          nationalId: draft.nationalId,
          districts: draft.districts,
          experience: draft.experience,
          availability: draft.availability,
          hourlyRate: draft.hourlyRate,
          cvUrl,
          cvName,
          status: "pending",
          createdAt: serverTimestamp()
        });
      } else {
        const id = makeId("cleaner");
        const profile: CleanerProfile = {
          id,
          fullName: draft.fullName,
          email: draft.email.toLowerCase(),
          phone: draft.phone,
          nationalId: draft.nationalId,
          districts: draft.districts,
          experience: draft.experience,
          availability: draft.availability,
          hourlyRate: draft.hourlyRate,
          cvName: cvFile?.name,
          status: "pending"
        };
        setLocalCleaners((items) => [profile, ...items]);
        setDemoUser({
          uid: id,
          email: profile.email,
          displayName: profile.fullName
        });
      }

      setNotice(
        "Perfil enviado. Rocio podra revisar tus datos y tu CV desde su dashboard."
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo crear el perfil."
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (auth) {
      await signOut(auth);
    }

    setDemoUser(null);
    setView("home");
  }

  async function updateRequestStatus(id: string, status: RequestStatus) {
    if (db) {
      await updateDoc(doc(db, "serviceRequests", id), { status });
    } else {
      setLocalRequests((items) =>
        items.map((item) => (item.id === id ? { ...item, status } : item))
      );
    }
  }

  async function createJob(job: JobDraft) {
    setBusy(true);
    setNotice("");

    try {
      if (db) {
        const createdJob = await addDoc(collection(db, "jobs"), {
          ...job,
          status: "available",
          createdAt: serverTimestamp()
        });

        if (job.requestId) {
          await updateDoc(doc(db, "serviceRequests", job.requestId), {
            status: "confirmed",
            assignedJobId: createdJob.id
          });
        }
      } else {
        const id = makeId("job");
        setLocalJobs((items) => [
          {
            id,
            ...job,
            status: "available"
          },
          ...items
        ]);

        if (job.requestId) {
          setLocalRequests((items) =>
            items.map((item) =>
              item.id === job.requestId
                ? { ...item, status: "confirmed", assignedJobId: id }
                : item
            )
          );
        }
      }

      setNotice(
        "Trabajo publicado. Las colaboradoras ya pueden verlo y tomarlo."
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo crear el trabajo."
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateJob(id: string, patch: Partial<CleaningJob>) {
    if (db) {
      await updateDoc(doc(db, "jobs", id), patch);
    } else {
      setLocalJobs((items) =>
        items.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    }
  }

  async function claimJob(job: CleaningJob) {
    if (!activeUser || !activeCleaner) {
      setNotice("Primero crea o completa tu perfil de colaboradora.");
      setView("auth");
      return;
    }

    await updateJob(job.id, {
      status: "scheduled",
      acceptedBy: activeUser.uid,
      acceptedByName: activeCleaner.fullName,
      acceptedByPhone: activeCleaner.phone,
      acceptedAt: db ? serverTimestamp() : new Date().toISOString()
    });
    setNotice("Trabajo agendado en tu tablero.");
  }

  async function advanceJob(job: CleaningJob, status: JobStatus) {
    const patch: Partial<CleaningJob> = { status };

    if (status === "in_progress") {
      patch.startedAt = db ? serverTimestamp() : new Date().toISOString();
    }

    if (status === "finished") {
      patch.finishedAt = db ? serverTimestamp() : new Date().toISOString();
    }

    await updateJob(job.id, patch);
  }

  return (
    <div className="app-shell">
      <Header
        activeUser={activeUser}
        isOwner={isOwner}
        view={view}
        setView={setView}
        onLogout={logout}
      />

      {!firebaseReady && (
        <div className="setup-strip">
          <ShieldCheck size={18} />
          <span>
            Modo demo activo. Agrega tus credenciales en <code>.env</code> para
            conectar Firebase Auth, Firestore y Storage.
          </span>
        </div>
      )}

      {collectionErrors.length > 0 && (
        <div className="setup-strip setup-strip-warning">
          <ShieldCheck size={18} />
          <span>{collectionErrors[0]}</span>
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {view === "home" && (
        <HomeView
          busy={busy}
          onSubmitRequest={submitServiceRequest}
          onOpenAuth={() => setView("auth")}
        />
      )}

      {view === "auth" && (
        <AuthView
          busy={busy || loading}
          onLogin={handleLogin}
          onRegister={registerCleaner}
        />
      )}

      {view === "owner" &&
        (isOwner ? (
          <OwnerDashboard
            requests={requests}
            jobs={jobs}
            cleaners={cleaners}
            busy={busy}
            onCreateJob={createJob}
            onUpdateRequestStatus={updateRequestStatus}
            onUpdateJob={updateJob}
          />
        ) : (
          <AccessState onOpenAuth={() => setView("auth")} />
        ))}

      {view === "cleaner" &&
        (activeUser ? (
          <CleanerDashboard
            jobs={jobs}
            activeCleaner={activeCleaner}
            activeUser={activeUser}
            onClaimJob={claimJob}
            onAdvanceJob={advanceJob}
            onOpenAuth={() => setView("auth")}
          />
        ) : (
          <AccessState onOpenAuth={() => setView("auth")} />
        ))}
    </div>
  );
}

function Header({
  activeUser,
  isOwner,
  view,
  setView,
  onLogout
}: {
  activeUser: ActiveUser | null;
  isOwner: boolean;
  view: View;
  setView: (view: View) => void;
  onLogout: () => void;
}) {
  return (
    <header className="site-header">
      <button className="brand-button" onClick={() => setView("home")}>
        <img src={logoUrl} alt="Nice Clean Servicios de Limpieza" />
      </button>

      <nav className="nav-actions" aria-label="Navegacion principal">
        <button
          className={view === "home" ? "nav-button active" : "nav-button"}
          onClick={() => setView("home")}
          title="Inicio"
        >
          <House size={17} />
          <span className="nav-label">Inicio</span>
        </button>
        <button
          className={view === "owner" ? "nav-button active" : "nav-button"}
          onClick={() => setView("owner")}
          title="Rocio"
        >
          <LayoutDashboard size={17} />
          <span className="nav-label">Rocio</span>
        </button>
        <button
          className={view === "cleaner" ? "nav-button active" : "nav-button"}
          onClick={() => setView("cleaner")}
          title="Limpieza"
        >
          <Users size={17} />
          <span className="nav-label">Limpieza</span>
        </button>
        {activeUser ? (
          <button className="nav-button" onClick={onLogout} title="Salir">
            <LogOut size={17} />
            <span className="nav-label">Salir</span>
          </button>
        ) : (
          <button
            className={view === "auth" ? "nav-button active" : "nav-button"}
            onClick={() => setView("auth")}
            title="Login"
          >
            <LogIn size={17} />
            <span className="nav-label">Login</span>
          </button>
        )}
      </nav>

      {activeUser && (
        <div className="user-pill">
          {isOwner ? "Duena" : "Colaboradora"} · {activeUser.email}
        </div>
      )}
    </header>
  );
}

function HomeView({
  busy,
  onSubmitRequest,
  onOpenAuth
}: {
  busy: boolean;
  onSubmitRequest: (draft: RequestDraft) => Promise<void>;
  onOpenAuth: () => void;
}) {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            Rohrmoser, Pavas y alrededores
          </div>
          <h1>Nice Clean Servicios de Limpieza</h1>
          <p>
            Limpieza residencial para casas familiares, apartamentos en torre,
            muebles y ropa por kilo, con instrucciones claras de ingreso y
            ubicacion exacta por Waze.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#pedido">
              <ClipboardList size={18} />
              Pedir servicio
            </a>
            <button className="secondary-action" onClick={onOpenAuth}>
              <UserCheck size={18} />
              Soy colaboradora
            </button>
          </div>
          <div className="hero-metrics" aria-label="Resumen operativo">
            <span>
              <strong>Waze</strong>
              direccion exacta
            </span>
            <span>
              <strong>3 estados</strong>
              agendado a finalizado
            </span>
            <span>
              <strong>CV</strong>
              perfiles revisables
            </span>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <img src={services[0].image} alt="" />
        </div>
      </section>

      <section className="content-band" id="servicios">
        <SectionHeader
          eyebrow="Servicios"
          title="Limpiezas listas para coordinar"
          text="Cada pedido guarda servicio, horario, entrada al lugar, Waze e instrucciones especificas."
        />
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service.id}>
              <img src={service.image} alt={service.title} />
              <div>
                <div className="card-meta">{service.priceHint}</div>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="request-layout" id="pedido">
        <div className="request-intro">
          <SectionHeader
            eyebrow="Pedido"
            title="Agenda con todos los detalles desde el inicio"
            text="Rocio recibe el pedido en su dashboard y lo convierte en trabajo disponible para las colaboradoras."
          />
          <div className="process-list">
            <span>
              <MapPin size={18} />
              Pega el link de Waze
            </span>
            <span>
              <House size={18} />
              Anota apartamento, casa o torre
            </span>
            <span>
              <FileText size={18} />
              Explica recepcion e instrucciones
            </span>
          </div>
        </div>
        <ServiceRequestForm busy={busy} onSubmit={onSubmitRequest} />
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="section-header">
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function ServiceRequestForm({
  busy,
  onSubmit
}: {
  busy: boolean;
  onSubmit: (draft: RequestDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<RequestDraft>(initialRequest);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(draft);
    setDraft(initialRequest);
  }

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <div className="form-title-row">
        <ClipboardList size={20} />
        <h3>Nuevo pedido de limpieza</h3>
      </div>
      <div className="form-grid two">
        <label>
          Servicio
          <select
            value={draft.serviceType}
            onChange={(event) =>
              setDraft({ ...draft, serviceType: event.target.value })
            }
          >
            {services.map((service) => (
              <option key={service.id} value={service.title}>
                {service.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo de lugar
          <select
            value={draft.propertyType}
            onChange={(event) =>
              setDraft({ ...draft, propertyType: event.target.value })
            }
          >
            <option>Apartamento en edificio</option>
            <option>Casa familiar</option>
            <option>Casa en condominio</option>
            <option>Otro</option>
          </select>
        </label>
        <label>
          Nombre
          <input
            required
            value={draft.customerName}
            onChange={(event) =>
              setDraft({ ...draft, customerName: event.target.value })
            }
          />
        </label>
        <label>
          Telefono
          <input
            required
            value={draft.customerPhone}
            onChange={(event) =>
              setDraft({ ...draft, customerPhone: event.target.value })
            }
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={draft.customerEmail}
            onChange={(event) =>
              setDraft({ ...draft, customerEmail: event.target.value })
            }
          />
        </label>
        <label>
          Fecha preferida
          <input
            type="date"
            value={draft.preferredDate}
            onChange={(event) =>
              setDraft({ ...draft, preferredDate: event.target.value })
            }
          />
        </label>
        <label>
          Hora preferida
          <input
            type="time"
            value={draft.preferredTime}
            onChange={(event) =>
              setDraft({ ...draft, preferredTime: event.target.value })
            }
          />
        </label>
        <label>
          Apartamento o casa
          <input
            placeholder="Torre, piso, apto, casa, porton"
            value={draft.apartment}
            onChange={(event) =>
              setDraft({ ...draft, apartment: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        Direccion escrita
        <input
          required
          value={draft.address}
          onChange={(event) =>
            setDraft({ ...draft, address: event.target.value })
          }
        />
      </label>
      <label>
        Link de Waze
        <input
          type="url"
          placeholder="https://waze.com/ul/..."
          value={draft.wazeUrl}
          onChange={(event) =>
            setDraft({ ...draft, wazeUrl: event.target.value })
          }
        />
      </label>
      <label>
        Instrucciones de entrada
        <textarea
          placeholder="Recepcion, guarda, cedula, parqueo, a quien llamar..."
          value={draft.entryInstructions}
          onChange={(event) =>
            setDraft({ ...draft, entryInstructions: event.target.value })
          }
        />
      </label>
      <label>
        Instrucciones de limpieza
        <textarea
          placeholder="Prioridades, productos, habitaciones, muebles, ropa..."
          value={draft.cleaningInstructions}
          onChange={(event) =>
            setDraft({ ...draft, cleaningInstructions: event.target.value })
          }
        />
      </label>
      <label>
        Notas adicionales
        <textarea
          value={draft.notes}
          onChange={(event) =>
            setDraft({ ...draft, notes: event.target.value })
          }
        />
      </label>
      <button className="primary-action form-submit" disabled={busy}>
        <ArrowRight size={18} />
        {busy ? "Guardando..." : "Enviar pedido"}
      </button>
    </form>
  );
}

function AuthView({
  busy,
  onLogin,
  onRegister
}: {
  busy: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (draft: CleanerDraft, cvFile: File | null) => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cleaner, setCleaner] = useState<CleanerDraft>(initialCleaner);
  const [cvFile, setCvFile] = useState<File | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(email, password);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onRegister(cleaner, cvFile);
    setCleaner(initialCleaner);
    setCvFile(null);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="segmented">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            <LogIn size={17} />
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            <Upload size={17} />
            Registro
          </button>
        </div>

        {mode === "login" ? (
          <form className="panel-form compact" onSubmit={handleLogin}>
            <div className="form-title-row">
              <ShieldCheck size={20} />
              <h2>Entrar a Nice Clean</h2>
            </div>
            <label>
              Correo
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={OWNER_EMAIL}
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                required={firebaseReady}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="primary-action form-submit" disabled={busy}>
              <LogIn size={18} />
              {busy ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="panel-form" onSubmit={handleRegister}>
            <div className="form-title-row">
              <UserCheck size={20} />
              <h2>Perfil de mujer de limpieza</h2>
            </div>
            <div className="form-grid two">
              <label>
                Nombre completo
                <input
                  required
                  value={cleaner.fullName}
                  onChange={(event) =>
                    setCleaner({ ...cleaner, fullName: event.target.value })
                  }
                />
              </label>
              <label>
                Cedula
                <input
                  required
                  value={cleaner.nationalId}
                  onChange={(event) =>
                    setCleaner({ ...cleaner, nationalId: event.target.value })
                  }
                />
              </label>
              <label>
                Correo
                <input
                  required
                  type="email"
                  value={cleaner.email}
                  onChange={(event) =>
                    setCleaner({ ...cleaner, email: event.target.value })
                  }
                />
              </label>
              <label>
                Telefono
                <input
                  required
                  value={cleaner.phone}
                  onChange={(event) =>
                    setCleaner({ ...cleaner, phone: event.target.value })
                  }
                />
              </label>
              <label>
                Contrasena
                <input
                  required={firebaseReady}
                  minLength={6}
                  type="password"
                  value={cleaner.password}
                  onChange={(event) =>
                    setCleaner({ ...cleaner, password: event.target.value })
                  }
                />
              </label>
              <label>
                Tarifa por hora
                <input
                  inputMode="numeric"
                  value={cleaner.hourlyRate}
                  onChange={(event) =>
                    setCleaner({ ...cleaner, hourlyRate: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Zonas disponibles
              <input
                value={cleaner.districts}
                onChange={(event) =>
                  setCleaner({ ...cleaner, districts: event.target.value })
                }
              />
            </label>
            <label>
              Experiencia
              <textarea
                required
                value={cleaner.experience}
                onChange={(event) =>
                  setCleaner({ ...cleaner, experience: event.target.value })
                }
              />
            </label>
            <label>
              Disponibilidad
              <textarea
                required
                value={cleaner.availability}
                onChange={(event) =>
                  setCleaner({ ...cleaner, availability: event.target.value })
                }
              />
            </label>
            <label className="file-input">
              <Upload size={18} />
              <span>{cvFile ? cvFile.name : "Subir CV PDF, Word o imagen"}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={(event) =>
                  setCvFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <button className="primary-action form-submit" disabled={busy}>
              <ArrowRight size={18} />
              {busy ? "Enviando..." : "Crear perfil gratis"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function OwnerDashboard({
  requests,
  jobs,
  cleaners,
  busy,
  onCreateJob,
  onUpdateRequestStatus,
  onUpdateJob
}: {
  requests: ServiceRequest[];
  jobs: CleaningJob[];
  cleaners: CleanerProfile[];
  busy: boolean;
  onCreateJob: (job: JobDraft) => Promise<void>;
  onUpdateRequestStatus: (id: string, status: RequestStatus) => Promise<void>;
  onUpdateJob: (id: string, patch: Partial<CleaningJob>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<JobDraft>(initialJob);

  const cleanerStats = useMemo(
    () =>
      cleaners.map((cleaner) => {
        const cleanerJobs = jobs.filter((job) => job.acceptedBy === cleaner.id);
        const completedHours = cleanerJobs
          .filter((job) => job.status === "finished")
          .reduce((total, job) => total + Number(job.estimatedHours || 0), 0);

        return {
          cleaner,
          jobsTaken: cleanerJobs.length,
          completedHours
        };
      }),
    [cleaners, jobs]
  );

  function fillFromRequest(request: ServiceRequest) {
    setDraft({
      serviceType: request.serviceType,
      customerName: request.customerName,
      customerPhone: request.customerPhone,
      wazeUrl: request.wazeUrl,
      address: request.address,
      apartment: request.apartment,
      entryInstructions: request.entryInstructions,
      cleaningInstructions: request.cleaningInstructions,
      scheduledDate: request.preferredDate,
      startTime: request.preferredTime,
      endTime: "",
      estimatedHours: 4,
      payRate: 3500,
      notes: request.notes,
      requestId: request.id
    });
  }

  async function handleJobSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreateJob(draft);
    setDraft(initialJob);
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">
            <LayoutDashboard size={16} />
            Dashboard de Rocio
          </div>
          <h1>Control total de pedidos, trabajos y horas</h1>
          <p>
            Revisa solicitudes del sitio, publica trabajos con Waze e
            instrucciones, y mira quien tomo cada servicio.
          </p>
        </div>
        <div className="owner-summary">
          <Metric value={requests.length} label="Pedidos" icon={<Mail />} />
          <Metric value={jobs.length} label="Trabajos" icon={<BriefcaseBusiness />} />
          <Metric value={cleaners.length} label="Perfiles" icon={<Users />} />
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel span-7">
          <PanelTitle icon={<ClipboardList />} title="Pedidos del sitio" />
          <div className="stack-list">
            {requests.length === 0 && <EmptyState text="No hay pedidos aun." />}
            {requests.map((request) => (
              <article className="request-row" key={request.id}>
                <div>
                  <div className="row-title">
                    <strong>{request.customerName}</strong>
                    <StatusBadge label={requestStatusLabels[request.status]} />
                  </div>
                  <p>
                    {request.serviceType} · {request.propertyType}
                  </p>
                  <p>{request.address}</p>
                  <div className="row-actions">
                    {request.wazeUrl && (
                      <a
                        className="icon-link"
                        href={request.wazeUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin size={16} />
                        Waze
                      </a>
                    )}
                    <button
                      className="icon-link as-button"
                      onClick={() => fillFromRequest(request)}
                    >
                      <Plus size={16} />
                      Crear trabajo
                    </button>
                  </div>
                </div>
                <div className="request-detail">
                  <span>{request.apartment || "Sin apto/casa"}</span>
                  <span>{request.entryInstructions || "Sin entrada"}</span>
                  <select
                    value={request.status}
                    onChange={(event) =>
                      onUpdateRequestStatus(
                        request.id,
                        event.target.value as RequestStatus
                      )
                    }
                  >
                    {Object.entries(requestStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form className="panel panel-form span-5" onSubmit={handleJobSubmit}>
          <PanelTitle icon={<Plus />} title="Publicar trabajo" />
          <div className="form-grid two">
            <label>
              Servicio
              <select
                value={draft.serviceType}
                onChange={(event) =>
                  setDraft({ ...draft, serviceType: event.target.value })
                }
              >
                {services.map((service) => (
                  <option key={service.id}>{service.title}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha
              <input
                required
                type="date"
                value={draft.scheduledDate}
                onChange={(event) =>
                  setDraft({ ...draft, scheduledDate: event.target.value })
                }
              />
            </label>
            <label>
              Inicio
              <input
                required
                type="time"
                value={draft.startTime}
                onChange={(event) =>
                  setDraft({ ...draft, startTime: event.target.value })
                }
              />
            </label>
            <label>
              Fin
              <input
                type="time"
                value={draft.endTime}
                onChange={(event) =>
                  setDraft({ ...draft, endTime: event.target.value })
                }
              />
            </label>
            <label>
              Horas
              <input
                required
                type="number"
                min="1"
                step="0.5"
                value={draft.estimatedHours}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    estimatedHours: Number(event.target.value)
                  })
                }
              />
            </label>
            <label>
              Pago por hora
              <input
                required
                type="number"
                min="0"
                value={draft.payRate}
                onChange={(event) =>
                  setDraft({ ...draft, payRate: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <label>
            Cliente
            <input
              required
              value={draft.customerName}
              onChange={(event) =>
                setDraft({ ...draft, customerName: event.target.value })
              }
            />
          </label>
          <label>
            Telefono del cliente
            <input
              value={draft.customerPhone}
              onChange={(event) =>
                setDraft({ ...draft, customerPhone: event.target.value })
              }
            />
          </label>
          <label>
            Link de Waze
            <input
              type="url"
              value={draft.wazeUrl}
              onChange={(event) =>
                setDraft({ ...draft, wazeUrl: event.target.value })
              }
            />
          </label>
          <label>
            Direccion
            <input
              required
              value={draft.address}
              onChange={(event) =>
                setDraft({ ...draft, address: event.target.value })
              }
            />
          </label>
          <label>
            Apartamento, casa o torre
            <input
              value={draft.apartment}
              onChange={(event) =>
                setDraft({ ...draft, apartment: event.target.value })
              }
            />
          </label>
          <label>
            Entrada y recepcion
            <textarea
              value={draft.entryInstructions}
              onChange={(event) =>
                setDraft({ ...draft, entryInstructions: event.target.value })
              }
            />
          </label>
          <label>
            Instrucciones de limpieza
            <textarea
              value={draft.cleaningInstructions}
              onChange={(event) =>
                setDraft({ ...draft, cleaningInstructions: event.target.value })
              }
            />
          </label>
          <label>
            Notas internas
            <textarea
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
            />
          </label>
          <button className="primary-action form-submit" disabled={busy}>
            <Plus size={18} />
            {busy ? "Publicando..." : "Publicar para colaboradoras"}
          </button>
        </form>
      </section>

      <section className="panel">
        <PanelTitle icon={<BriefcaseBusiness />} title="Trabajos publicados" />
        <div className="job-table">
          {jobs.map((job) => (
            <article className="job-row" key={job.id}>
              <div>
                <strong>{job.serviceType}</strong>
                <span>{job.customerName}</span>
              </div>
              <div>
                <Clock3 size={16} />
                <span>
                  {job.scheduledDate} · {job.startTime}
                </span>
              </div>
              <div>
                <UserCheck size={16} />
                <span>{job.acceptedByName || "Sin asignar"}</span>
              </div>
              <select
                value={job.status}
                onChange={(event) =>
                  onUpdateJob(job.id, {
                    status: event.target.value as JobStatus
                  })
                }
              >
                {Object.entries(jobStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={<Users />} title="Colaboradoras y horas" />
        <div className="cleaner-grid">
          {cleanerStats.map(({ cleaner, jobsTaken, completedHours }) => (
            <article className="cleaner-card" key={cleaner.id}>
              <div className="avatar">{cleaner.fullName.slice(0, 1)}</div>
              <div>
                <h3>{cleaner.fullName}</h3>
                <p>{cleaner.email}</p>
                <p>{cleaner.phone}</p>
                <div className="mini-stats">
                  <span>{jobsTaken} trabajos</span>
                  <span>{completedHours} horas finalizadas</span>
                </div>
                <p>{cleaner.experience}</p>
                <div className="row-actions">
                  <StatusBadge label={cleaner.status} />
                  {cleaner.cvUrl && (
                    <a
                      className="icon-link"
                      href={cleaner.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye size={16} />
                      CV
                    </a>
                  )}
                  {!cleaner.cvUrl && cleaner.cvName && (
                    <span className="icon-link">
                      <FileText size={16} />
                      {cleaner.cvName}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function CleanerDashboard({
  jobs,
  activeCleaner,
  activeUser,
  onClaimJob,
  onAdvanceJob,
  onOpenAuth
}: {
  jobs: CleaningJob[];
  activeCleaner: CleanerProfile | undefined;
  activeUser: ActiveUser;
  onClaimJob: (job: CleaningJob) => Promise<void>;
  onAdvanceJob: (job: CleaningJob, status: JobStatus) => Promise<void>;
  onOpenAuth: () => void;
}) {
  const availableJobs = jobs.filter((job) => job.status === "available");
  const myJobs = jobs.filter(
    (job) =>
      job.acceptedBy === activeUser.uid ||
      job.acceptedByName === activeCleaner?.fullName
  );
  const completedHours = myJobs
    .filter((job) => job.status === "finished")
    .reduce((total, job) => total + Number(job.estimatedHours || 0), 0);
  const plannedHours = myJobs
    .filter((job) => job.status !== "finished")
    .reduce((total, job) => total + Number(job.estimatedHours || 0), 0);

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <div className="eyebrow">
            <CalendarCheck size={16} />
            Dashboard de colaboradora
          </div>
          <h1>Escoge trabajos y controla tu horario</h1>
          <p>
            Mira servicios disponibles, agenda los que puedas hacer y marca el
            avance hasta finalizar.
          </p>
        </div>
        <div className="owner-summary">
          <Metric value={availableJobs.length} label="Disponibles" icon={<BriefcaseBusiness />} />
          <Metric value={plannedHours} label="Horas planeadas" icon={<Clock3 />} />
          <Metric value={completedHours} label="Horas finalizadas" icon={<CheckCircle2 />} />
        </div>
      </section>

      {!activeCleaner && (
        <div className="setup-strip setup-strip-warning">
          <UserCheck size={18} />
          <span>
            Este correo aun no tiene perfil de colaboradora. Crea el registro
            gratis para que Rocio pueda revisar tus datos.
          </span>
          <button className="secondary-action small" onClick={onOpenAuth}>
            Registro
          </button>
        </div>
      )}

      <section className="panel">
        <PanelTitle icon={<BriefcaseBusiness />} title="Trabajos disponibles" />
        <div className="available-grid">
          {availableJobs.length === 0 && (
            <EmptyState text="No hay trabajos disponibles en este momento." />
          )}
          {availableJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              action={
                <button
                  className="primary-action"
                  onClick={() => onClaimJob(job)}
                  disabled={!activeCleaner}
                >
                  <CalendarCheck size={18} />
                  Tomar trabajo
                </button>
              }
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={<ListIcon />} title="Mi horario" />
        <div className="available-grid">
          {myJobs.length === 0 && (
            <EmptyState text="Aun no has tomado trabajos." />
          )}
          {myJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              action={
                <div className="status-actions">
                  <button
                    className="secondary-action small"
                    onClick={() => onAdvanceJob(job, "scheduled")}
                  >
                    <CalendarCheck size={16} />
                    Agendado
                  </button>
                  <button
                    className="secondary-action small"
                    onClick={() => onAdvanceJob(job, "in_progress")}
                  >
                    <PlayCircle size={16} />
                    En Proceso
                  </button>
                  <button
                    className="secondary-action small"
                    onClick={() => onAdvanceJob(job, "finished")}
                  >
                    <CheckCircle2 size={16} />
                    Finalizado
                  </button>
                </div>
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function JobCard({ job, action }: { job: CleaningJob; action: React.ReactNode }) {
  return (
    <article className="job-card">
      <div className="row-title">
        <h3>{job.serviceType}</h3>
        <StatusBadge label={jobStatusLabels[job.status]} />
      </div>
      <p>{job.customerName}</p>
      <div className="job-facts">
        <span>
          <Clock3 size={16} />
          {job.scheduledDate} · {job.startTime}
        </span>
        <span>
          <CheckCircle2 size={16} />
          {job.estimatedHours} horas ·{" "}
          {currencyFormatter.format(job.payRate)}/h
        </span>
        <span>
          <Phone size={16} />
          {job.customerPhone || "Sin telefono"}
        </span>
      </div>
      <div className="address-block">
        <strong>{job.address}</strong>
        <span>{job.apartment}</span>
        <span>{job.entryInstructions}</span>
      </div>
      <p>{job.cleaningInstructions}</p>
      <div className="row-actions">
        {job.wazeUrl && (
          <a
            className="icon-link"
            href={job.wazeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin size={16} />
            Abrir Waze
          </a>
        )}
        {action}
      </div>
    </article>
  );
}

function Metric({
  value,
  label,
  icon
}: {
  value: string | number;
  label: string;
  icon: React.ReactElement;
}) {
  return (
    <div className="metric">
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PanelTitle({
  icon,
  title
}: {
  icon: React.ReactElement;
  title: string;
}) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return <span className="status-badge">{label}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function AccessState({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <main className="auth-shell">
      <section className="auth-panel access-state">
        <ShieldCheck size={38} />
        <h1>Necesitas iniciar sesion</h1>
        <p>
          Entra como Rocio con el correo oficial o registrate como colaboradora
          de limpieza.
        </p>
        <button className="primary-action" onClick={onOpenAuth}>
          <LogIn size={18} />
          Abrir login
        </button>
      </section>
    </main>
  );
}

function ListIcon() {
  return <ClipboardList />;
}
