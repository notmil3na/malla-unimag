import { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./ColaboracionView.module.css";
import {
  IconUsers, IconSearch, IconUserPlus, IconCheck, IconClose, IconWarning,
  IconTrash, IconSchedule, IconStar,
} from "./Icons";
import {
  fetchUsersBrief, fetchFriendships, sendFriendRequest,
  acceptFriendship, removeFriendship, fetchFriendData,
} from "../utils/friendsApi.js";
import {
  DAY_LABELS, WINDOW_START, WINDOW_END,
  formatHourIdx, buildBusyByDay, cellStatuses,
  commonFreeSlots, unionDias, cursandoMaterias, commonSubjects,
  progressFromMalla,
} from "../utils/scheduleCompare.js";

// Script para crear la tabla (mismo contenido que migracion_amigos.sql).
const MIGRATION_SQL = `create table if not exists public.friendships (
  id              uuid primary key default gen_random_uuid(),
  user_username   text not null references public.users(username) on delete cascade,
  friend_username text not null references public.users(username) on delete cascade,
  status          text not null default 'pendiente'
                  check (status in ('pendiente', 'aceptado')),
  requested_by    text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_username, friend_username)
);

create index if not exists friendships_user_idx   on public.friendships (user_username);
create index if not exists friendships_friend_idx on public.friendships (friend_username);`;

const STATUS_LABEL = { libre: "Libre en común", yo: "Solo tú", amigo: "Solo tu amigo", ambos: "Ambos ocupados" };

// ── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ u, size = 40 }) {
  const initial = ((u?.name || u?.username || "?").trim()[0] || "?").toUpperCase();
  if (u?.photo) {
    return (
      <div className={styles.avatar} style={{ width: size, height: size }}>
        <img src={u.photo} alt="" className={styles.avatarImg} />
      </div>
    );
  }
  return (
    <div className={styles.avatar} style={{ width: size, height: size }}>
      <span>{initial}</span>
    </div>
  );
}

// ── Cuadrícula de comparación ─────────────────────────────────────────────
function ComparadorGrid({ myHorario, frHorario }) {
  const myBusy = useMemo(() => buildBusyByDay(myHorario?.clases || []), [myHorario]);
  const frBusy = useMemo(() => buildBusyByDay(frHorario?.clases || []), [frHorario]);
  const statuses = useMemo(() => cellStatuses(myBusy, frBusy), [myBusy, frBusy]);
  const slots = useMemo(() => commonFreeSlots(myBusy, frBusy), [myBusy, frBusy]);
  const dias = useMemo(() => unionDias(myHorario, frHorario), [myHorario, frHorario]);
  const totalHoras = slots.reduce((a, s) => a + s.duracion, 0);
  const horas = [];
  for (let h = WINDOW_START; h < WINDOW_END; h++) horas.push(h);

  const miHorarioVacio = !(myHorario?.clases || []).length;
  const amigoHorarioVacio = !(frHorario?.clases || []).length;

  return (
    <div className={styles.gridCard}>
      <div className={styles.gridHeader}>
        <h4 className={styles.gridTitle}>Huecos en común</h4>
        <div className={styles.legend}>
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <span key={k} className={styles.legendItem}>
              <i className={`${styles.legendDot} ${styles["dot" + k[0].toUpperCase() + k.slice(1)]}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {(miHorarioVacio || amigoHorarioVacio) && (
        <p className={styles.gridHint}>
          <IconWarning size={12} />
          {miHorarioVacio && amigoHorarioVacio
            ? "Ambos horarios están vacíos: todas las franjas aparecen como libres."
            : miHorarioVacio
              ? "Tu horario está vacío: se asume que estás libre toda la ventana."
              : "El horario de tu amigo está vacío: se asume que está libre toda la ventana."}
        </p>
      )}

      {dias.length === 0 ? (
        <p className={styles.gridEmpty}>Ninguno de los dos tiene clases agendadas aún.</p>
      ) : (
        <div className={styles.gridScroll}>
          <div className={styles.compareGrid} style={{ "--num-horas": horas.length }}>
            <div className={styles.gridCorner} />
            {horas.map((h) => (
              <div key={h} className={styles.gridHourHead}>{formatHourIdx(h)}</div>
            ))}
            {dias.map((d) => (
              <div key={d} className={styles.gridRow} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.gridDay}>{DAY_LABELS[d]}</div>
                {(statuses[d] || []).map((st, h) => (
                  <div
                    key={h}
                    className={`${styles.gridCell} ${styles["cell" + st[0].toUpperCase() + st.slice(1)]}`}
                    title={`${DAY_LABELS[d]} ${formatHourIdx(h)} – ${formatHourIdx(h + 1)} · ${STATUS_LABEL[st]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.slotStats}>
        <span className={styles.slotStat}>
          <strong>{totalHoras} h</strong> libres en común / semana
        </span>
        <span className={styles.slotStat}>
          <strong>{slots.length}</strong> franja{slots.length !== 1 ? "s" : ""} de ≥ 1 h
        </span>
      </div>

      <div className={styles.slotList}>
        {slots.length === 0 ? (
          <p className={styles.slotEmpty}>No hay franjas libres en común de al menos 1 hora.</p>
        ) : (
          slots.map((s, i) => (
            <div key={i} className={styles.slotRow}>
              <span className={styles.slotDay}>{DAY_LABELS[s.dia]}</span>
              <span className={styles.slotRange}>
                {formatHourIdx(s.inicio)} – {formatHourIdx(s.fin)}
              </span>
              <span className={styles.slotDur}>{s.duracion} h</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Panel de comparación ──────────────────────────────────────────────────
function ComparisonSection({ me, perfil, data, myHorario, myMalla, onClose }) {
  const frHorario = data?.horario || { dias: [], clases: [] };
  const frMalla = data?.malla || [];
  const frCursando = useMemo(() => cursandoMaterias(frMalla), [frMalla]);
  const compartidas = useMemo(() => commonSubjects(myMalla, frMalla), [myMalla, frMalla]);
  const progress = useMemo(() => progressFromMalla(frMalla), [frMalla]);
  const nombre = perfil?.name || me;
  const hasMalla = progress.totalCred > 0;

  return (
    <section className={styles.compareSection}>
      <div className={styles.compareHeader}>
        <div className={styles.compareTitleRow}>
          <Avatar u={perfil || { name: me }} size={44} />
          <div>
            <h3 className={styles.compareName}>{nombre}</h3>
            <p className={styles.compareSub}>
              @{me}
              {perfil?.university ? ` · ${perfil.university}` : ""}
              {perfil?.career ? ` · ${perfil.career}` : ""}
              {perfil?.semester ? ` · Sem. ${perfil.semester}` : ""}
            </p>
          </div>
        </div>
        <button className={styles.btnIcon} title="Cerrar comparación" onClick={onClose}>
          <IconClose size={14} />
        </button>
      </div>

      <div className={styles.compareBody}>
        {/* Columna izquierda: perfil académico */}
        <div className={styles.profileCol}>
          <div className={styles.profileBlock}>
            <h4 className={styles.blockTitle}>Materias que comparten</h4>
            {compartidas.length === 0 ? (
              <p className={styles.blockMuted}>
                No tienen materias en común (o tu amigo aún no marca materias como "Cursando").
              </p>
            ) : (
              <div className={styles.sharedChips}>
                {compartidas.map((m) => (
                  <span key={m.id} className={styles.sharedChip}>
                    <IconStar size={10} /> {m.id}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.profileBlock}>
            <h4 className={styles.blockTitle}>Cursando ahora</h4>
            {frCursando.length === 0 ? (
              <p className={styles.blockMuted}>Aún no tiene materias marcadas como "Cursando".</p>
            ) : (
              <ul className={styles.frMaterias}>
                {frCursando.map((m) => (
                  <li key={m.id}>
                    <span className={styles.frMateriaId}>{m.id}</span>
                    <span className={styles.frMateriaNombre}>{m.nombre}</span>
                    <span className={styles.frMateriaCred}>{m.creditos} cr</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.profileBlock}>
            <h4 className={styles.blockTitle}>Progreso de carrera</h4>
            {!hasMalla ? (
              <p className={styles.blockMuted}>Sin datos de malla guardados.</p>
            ) : (
              <>
                <div className={styles.progressLabelRow}>
                  <span>{progress.aprobadas} de {progress.total} materias</span>
                  <span>{progress.aprobCred} / {progress.totalCred} cr · {progress.pct}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${progress.pct}%` }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Columna derecha: comparación de horarios */}
        <ComparadorGrid myHorario={myHorario} frHorario={frHorario} />
      </div>
    </section>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function ColaboracionView({ user, malla, horarioData, onNotify }) {
  const [users, setUsers] = useState([]);
  const [friendships, setFriendships] = useState({});
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendData, setFriendData] = useState(null);
  const [comparing, setComparing] = useState(false);

  const reloadFriendships = useCallback(async () => {
    const res = await fetchFriendships(user.username);
    if (res.missingTable) {
      setTableMissing(true);
      setFriendships({});
      return;
    }
    if (res.error) {
      setLoadError(true);
      setFriendships({});
      return;
    }
    setLoadError(false);
    setTableMissing(false);
    setFriendships(res.data);
  }, [user.username]);

  useEffect(() => {
    let active = true;
    (async () => {
      const usersRes = await fetchUsersBrief();
      if (active) {
        if (!usersRes.error) setUsers(usersRes.data);
        else setLoadError(true);
      }
      await reloadFriendships();
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [reloadFriendships]);

  const handleSend = async (u) => {
    const res = await sendFriendRequest(user.username, u);
    if (res.missingTable) return setTableMissing(true);
    if (res.error) return onNotify("No se pudo enviar la solicitud");
    onNotify(`Solicitud enviada a ${u}`);
    reloadFriendships();
  };

  const handleAccept = async (u) => {
    const res = await acceptFriendship(user.username, u);
    if (res.missingTable) return setTableMissing(true);
    if (res.error) return onNotify("No se pudo aceptar la solicitud");
    onNotify(`Ahora ${u} y tú son amigos`);
    reloadFriendships();
  };

  const handleRemove = async (u) => {
    const res = await removeFriendship(user.username, u);
    if (res.missingTable) return setTableMissing(true);
    if (res.error) return onNotify("No se pudo completar la acción");
    onNotify("Amistad eliminada");
    if (selectedUser === u) {
      setSelectedUser(null);
      setFriendData(null);
    }
    reloadFriendships();
  };

  const handleCompare = async (u) => {
    setSelectedUser(u);
    setFriendData(null);
    setComparing(true);
    const res = await fetchFriendData(u);
    setComparing(false);
    if (res.error) {
      onNotify(`No se pudo cargar el horario de ${u}`);
      setSelectedUser(null);
      return;
    }
    setFriendData(res.data);
  };

  const rel = (u) => friendships[u];
  const isIncoming = (u) => rel(u)?.status === "pendiente" && rel(u).requestedBy !== user.username;
  const isOutgoing = (u) => rel(u)?.status === "pendiente" && rel(u).requestedBy === user.username;
  const isFriend = (u) => rel(u)?.status === "aceptado";

  const amigos = users.filter((u) => isFriend(u.username));
  const incoming = users.filter((u) => isIncoming(u.username));
  const outgoing = users.filter((u) => isOutgoing(u.username));

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? users.filter(
        (u) =>
          u.username !== user.username &&
          ((u.name || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q))
      )
    : [];

  const selectedProfile = users.find((u) => u.username === selectedUser);
  const selectedRel = selectedUser ? rel(selectedUser) : null;

  const copyMigration = () => {
    const doCopy = () => {
      onNotify("Script copiado al portapapeles");
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(MIGRATION_SQL).then(doCopy).catch(() => doCopy());
    } else {
      const ta = document.createElement("textarea");
      ta.value = MIGRATION_SQL;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); doCopy(); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}><span className={styles.loadingIcon}><IconUsers size={28} /></span>Cargando contactos...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.wrap} view-fade`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Colaboración</h2>
          <p className={styles.subtitle}>Agrega amigos y encuentra huecos en común para estudiar juntos</p>
        </div>
        <div className={styles.headerBadge}>
          <IconUsers size={14} /> {amigos.length} amigo{amigos.length !== 1 ? "s" : ""}
        </div>
      </div>

      {tableMissing && (
        <div className={styles.migrationCard}>
          <div className={styles.migrationIcon}><IconWarning size={18} /></div>
          <div className={styles.migrationBody}>
            <h3 className={styles.migrationTitle}>Falta la tabla de amistades</h3>
            <p className={styles.migrationText}>
              Para activar la colaboración, pega este script en el <strong>SQL Editor</strong> del dashboard de Supabase y presiona <strong>Run</strong>. Luego recarga la página.
            </p>
            <pre className={styles.migrationPre}>{MIGRATION_SQL}</pre>
            <button className={styles.btnPrimary} onClick={copyMigration}>Copiar script</button>
          </div>
        </div>
      )}

      {loadError && !tableMissing && (
        <p className={styles.errorBanner}><IconWarning size={13} /> No se pudo conectar con la base de datos.</p>
      )}

      {!tableMissing && (<>
        {/* Buscar personas */}
        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h3 className={styles.sectionTitle}>Buscar personas</h3>
            <span className={styles.sectionHint}>Agrega por nombre o usuario</span>
          </div>
          <div className={styles.searchRow}>
            <IconSearch size={15} />
            <input
              className={styles.searchInput}
              placeholder="Busca por nombre o usuario…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {query && searchResults.length === 0 && (
            <p className={styles.searchEmpty}>Sin resultados para <strong>"{query}"</strong>.</p>
          )}

          {query && searchResults.length > 0 && (
            <div className={styles.personGrid}>
              {searchResults.map((u) => (
                <div key={u.username} className={styles.personCard}>
                  <Avatar u={u} />
                  <div className={styles.personInfo}>
                    <p className={styles.personName}>{u.name || u.username}</p>
                    <p className={styles.personUser}>@{u.username}</p>
                    <p className={styles.personMeta}>
                      {u.career || "—"}{u.semester ? ` · Sem. ${u.semester}` : ""}
                    </p>
                  </div>
                  <div className={styles.personActions}>
                    {isFriend(u.username) ? (
                      <span className={styles.tagFriend}><IconCheck size={11} /> Amigos</span>
                    ) : isIncoming(u.username) ? (
                      <>
                        <button className={styles.btnPrimary} onClick={() => handleAccept(u.username)}>
                          <IconCheck size={12} /> Aceptar
                        </button>
                        <button className={styles.btnGhost} onClick={() => handleRemove(u.username)}>
                          <IconClose size={12} /> Rechazar
                        </button>
                      </>
                    ) : isOutgoing(u.username) ? (
                      <span className={styles.tagPending}><IconSchedule size={11} /> Pendiente…</span>
                    ) : (
                      <button className={styles.btnPrimary} onClick={() => handleSend(u.username)}>
                        <IconUserPlus size={12} /> Agregar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!query && outgoing.length > 0 && (
            <p className={styles.outgoingNote}>
              <IconWarning size={12} /> {outgoing.length} solicitud{outgoing.length !== 1 ? "es" : ""} enviada{outgoing.length !== 1 ? "s" : ""} esperando respuesta.
            </p>
          )}
        </section>

        {/* Solicitudes entrantes */}
        {incoming.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionTitleRow}>
              <h3 className={styles.sectionTitle}>Solicitudes pendientes</h3>
              <span className={styles.badgePill}>{incoming.length}</span>
            </div>
            <div className={styles.personGrid}>
              {incoming.map((u) => (
                <div key={u.username} className={styles.personCard}>
                  <Avatar u={u} />
                  <div className={styles.personInfo}>
                    <p className={styles.personName}>{u.name || u.username}</p>
                    <p className={styles.personUser}>@{u.username}</p>
                    <p className={styles.personMeta}>
                      {u.career || "—"}{u.semester ? ` · Sem. ${u.semester}` : ""}
                    </p>
                  </div>
                  <div className={styles.personActions}>
                    <button className={styles.btnPrimary} onClick={() => handleAccept(u.username)}>
                      <IconCheck size={12} /> Aceptar
                    </button>
                    <button className={styles.btnGhost} onClick={() => handleRemove(u.username)}>
                      <IconClose size={12} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mis amigos */}
        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h3 className={styles.sectionTitle}>Mis amigos</h3>
            <span className={styles.badgePill}>{amigos.length}</span>
          </div>

          {amigos.length === 0 ? (
            <div className={styles.friendsEmpty}>
              <span className={styles.friendsEmptyIcon}><IconUsers size={30} /></span>
              <p>Aún no tienes amigos.</p>
              <p className={styles.friendsEmptySub}>
                Busca personas arriba y envíales una solicitud para poder comparar horarios.
              </p>
            </div>
          ) : (
            <div className={styles.personGrid}>
              {amigos.map((u) => (
                <div key={u.username} className={styles.personCard}>
                  <Avatar u={u} />
                  <div className={styles.personInfo}>
                    <p className={styles.personName}>{u.name || u.username}</p>
                    <p className={styles.personUser}>@{u.username}</p>
                    <p className={styles.personMeta}>
                      {u.career || "—"}{u.semester ? ` · Sem. ${u.semester}` : ""}
                    </p>
                  </div>
                  <div className={styles.personActions}>
                    <button className={styles.btnPrimary} onClick={() => handleCompare(u.username)}>
                      <IconSchedule size={12} /> Comparar
                    </button>
                    <button
                      className={styles.btnIconDanger}
                      title="Quitar amigo"
                      onClick={() => handleRemove(u.username)}
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Comparación */}
        {selectedUser && comparing && (
          <div className={styles.comparingCard}>
            <span className={styles.loadingSpinner} /> Cargando horario de {selectedUser}...
          </div>
        )}

        {selectedUser && !comparing && friendData && (
          <ComparisonSection
            me={selectedUser}
            perfil={selectedProfile}
            data={friendData}
            myHorario={horarioData}
            myMalla={malla}
            onClose={() => { setSelectedUser(null); setFriendData(null); }}
          />
        )}

        {selectedUser && !comparing && !friendData && !selectedRel && (
          <p className={styles.errorBanner}><IconWarning size={13} /> No se pudo cargar la comparación.</p>
        )}
      </>)}
    </div>
  );
}
