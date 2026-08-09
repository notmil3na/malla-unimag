import { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./ColaboracionView.module.css";
import {
  IconUsers, IconSearch, IconUserPlus, IconCheck, IconClose, IconWarning,
  IconTrash, IconSchedule, IconStar, IconScale,
} from "./Icons";
import { ACCENT_COLORS } from "../utils/horarioHelpers.js";
import {
  fetchUsersBrief, fetchFriendships, sendFriendRequest,
  acceptFriendship, removeFriendship, fetchFriendData,
} from "../utils/friendsApi.js";
import {
  DAY_LABELS, WINDOW_START, WINDOW_END,
  formatHourIdx, buildBusyByDay, cellStatuses,
  commonFreeSlots, unionDias, cursandoMaterias, commonSubjects,
  progressFromMalla, overlappingClasses, overlapHoursByDay,
} from "../utils/scheduleCompare.js";
import { horaIdx, toViewHora } from "../utils/horarioHelpers.js";

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
            ? "Ninguno tiene horario todavía, así que todas las franjas se ven libres."
            : miHorarioVacio
              ? "No tienes horario todavía: se asume que estás libre toda la ventana."
              : "Tu amigo no tiene horario todavía: se asume que está libre toda la ventana."}
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
          <p className={styles.slotEmpty}>No encontraron franjas libres en común de al menos 1 hora.</p>
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

// ── Comparación de horarios ───────────────────────────────────────────────
// Mini horario de solo lectura para la comparación lado a lado.
function MiniSchedule({ title, subtitle, clases, dias, horas, colorMap, overlapHours }) {
  const CELL_H = 26;
  const esCoincidencia = (d, s, e) => {
    const set = overlapHours[d];
    if (!set) return false;
    for (let h = s; h < e; h++) if (set.has(h)) return true;
    return false;
  };
  return (
    <div className={styles.miniSched}>
      <div className={styles.miniSchedHead}>
        <span className={styles.miniSchedTitle}>{title}</span>
        <span className={styles.miniSchedSub} title={subtitle}>{subtitle}</span>
      </div>
      <div className={styles.miniSchedScroll}>
        <div className={styles.miniSchedGrid}>
          <div className={styles.miniSchedHourCol}>
            <div className={styles.miniSchedHourHead} />
            {horas.map((h) => (
              <div key={h} className={styles.miniSchedHourCell}>{formatHourIdx(h)}</div>
            ))}
          </div>
          {dias.map((d) => {
            const dayClases = (clases || []).filter((c) => c.dia === d);
            return (
              <div key={d} className={styles.miniSchedDay}>
                <div className={styles.miniSchedDayHead} title={DAY_LABELS[d]}>{d}</div>
                <div className={styles.miniSchedDayBody} style={{ height: horas.length * CELL_H }}>
                  {dayClases.map((c, i) => {
                    const s = horaIdx(c.horaInicio), e = horaIdx(c.horaFin);
                    if (s < 0 || e <= s) return null;
                    const overlap = esCoincidencia(d, s, e);
                    const color = colorMap[c.materiaId] || "var(--accent)";
                    return (
                      <div key={i}
                        className={`${styles.miniSchedBlock} ${overlap ? styles.miniSchedBlockOverlap : ""}`}
                        style={{ top: s * CELL_H, height: (e - s) * CELL_H - 2, "--block-color": color }}
                        title={`${c.materiaId}${c.grupo ? ` - ${c.grupo}` : ""}${c.profesor ? ` · ${c.profesor}` : ""} | ${toViewHora(c.horaInicio)}–${toViewHora(c.horaFin)}${c.salonLabel ? ` | ${c.salonLabel}` : ""}`}>
                        <span className={styles.miniSchedBlockId}>{c.materiaId}{c.grupo ? ` (${c.grupo})` : ""}</span>
                        <span className={styles.miniSchedBlockHora}>{toViewHora(c.horaInicio)}–{toViewHora(c.horaFin)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Panel "Comparar horarios": ambos horarios lado a lado + coincidencias.
function ComparadorHorarios({ myHorario, frHorario, myMalla, frMalla, myName = "Tú", frName }) {
  const myClases = myHorario?.clases || [];
  const frClases = frHorario?.clases || [];
  const horas = [];
  for (let h = WINDOW_START; h < WINDOW_END; h++) horas.push(h);

  const dias = useMemo(() => unionDias(myHorario, frHorario), [myHorario, frHorario]);
  const overlaps = useMemo(() => overlappingClasses(myClases, frClases), [myClases, frClases]);
  const overlapHours = useMemo(() => overlapHoursByDay(myClases, frClases), [myClases, frClases]);

  const myMaterias = useMemo(() => cursandoMaterias(myMalla), [myMalla]);
  const frMaterias = useMemo(() => cursandoMaterias(frMalla), [frMalla]);
  const myColorMap = {};
  myMaterias.forEach((m, i) => { myColorMap[m.id] = ACCENT_COLORS[i % ACCENT_COLORS.length]; });
  const frColorMap = {};
  frMaterias.forEach((m, i) => { frColorMap[m.id] = ACCENT_COLORS[i % ACCENT_COLORS.length]; });

  const totalMismaMateria = overlaps.filter((o) => o.mismaMateria).length;
  const totalMismoSalon = overlaps.filter((o) => o.mismoSalon).length;
  const totalHoras = overlaps.reduce((a, o) => a + o.duracion, 0);
  const hayHorarios = myClases.length > 0 || frClases.length > 0;

  return (
    <div className={styles.gridCard}>
      <div className={styles.gridHeader}>
        <h4 className={styles.gridTitle}>Comparar horarios</h4>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <i className={styles.legendDot} style={{ background: "var(--accent)" }} /> Tu horario
          </span>
          <span className={styles.legendItem}>
            <i className={styles.legendDot} style={{ background: "#8A7DA8" }} /> Horario de {frName}
          </span>
          <span className={styles.legendItem}>
            <i className={styles.legendDot} style={{ background: "color-mix(in srgb, #E87098 45%, transparent)", border: "1px solid #E87098" }} /> Coinciden
          </span>
        </div>
      </div>

      {!hayHorarios ? (
        <p className={styles.gridHint}>
          <IconWarning size={12} /> Ninguno tiene clases agendadas todavía, así que no hay nada que comparar.
        </p>
      ) : (
        <div className={styles.horariosDual}>
          <MiniSchedule
            title="Mi horario"
            subtitle={myName}
            clases={myClases}
            dias={dias}
            horas={horas}
            colorMap={myColorMap}
            overlapHours={overlapHours}
          />
          <MiniSchedule
            title="Horario"
            subtitle={frName}
            clases={frClases}
            dias={dias}
            horas={horas}
            colorMap={frColorMap}
            overlapHours={overlapHours}
          />
        </div>
      )}

      <div className={styles.slotStats}>
        <span className={styles.slotStat}>
          <strong>{overlaps.length}</strong> coincidencia{overlaps.length !== 1 ? "s" : ""} de clase
        </span>
        <span className={styles.slotStat}><strong>{totalMismaMateria}</strong> misma materia</span>
        <span className={styles.slotStat}><strong>{totalMismoSalon}</strong> mismo salón</span>
        <span className={styles.slotStat}>
          <strong>{totalHoras} h</strong> coinciden / semana
        </span>
      </div>

      <div className={styles.coincTitle}>Clases a la misma hora</div>
      <div className={styles.slotList}>
        {overlaps.length === 0 ? (
          <p className={styles.slotEmpty}>No tienen clases a la misma hora.</p>
        ) : (
          overlaps.map((o, i) => (
            <div key={i} className={`${styles.coincRow} ${o.mismaMateria ? styles.coincRowMateria : ""}`}>
              <span className={styles.slotDay}>{DAY_LABELS[o.dia]}</span>
              <span className={styles.coincHora}>{formatHourIdx(o.inicio)} – {formatHourIdx(o.fin)}</span>
              <span className={styles.coincDetalle}>
                {o.mismaMateria ? (
                  <>
                    <strong>{o.miClase.materiaId}</strong> · ¡misma materia!
                    {o.miClase.grupo && o.frClase.grupo && o.miClase.grupo !== o.frClase.grupo
                      ? ` (${o.miClase.grupo} vs ${o.frClase.grupo})`
                      : o.miClase.grupo ? ` (${o.miClase.grupo})` : ""}
                  </>
                ) : (
                  <>
                    <strong>{myName}:</strong> {o.miClase.materiaId}{o.miClase.grupo ? ` (${o.miClase.grupo})` : ""}
                    {" · "}
                    <strong>{frName}:</strong> {o.frClase.materiaId}{o.frClase.grupo ? ` (${o.frClase.grupo})` : ""}
                  </>
                )}
                {o.mismoSalon && <span className={styles.coincSalon}> · mismo salón {o.miClase.salonLabel}</span>}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Panel de comparación ──────────────────────────────────────────────────
function ComparisonSection({ me, perfil, data, myHorario, myMalla, myName, onClose }) {
  const frHorario = data?.horario || { dias: [], clases: [] };
  const frMalla = data?.malla || [];
  const frCursando = useMemo(() => cursandoMaterias(frMalla), [frMalla]);
  const compartidas = useMemo(() => commonSubjects(myMalla, frMalla), [myMalla, frMalla]);
  const progress = useMemo(() => progressFromMalla(frMalla), [frMalla]);
  const nombre = perfil?.name || me;
  const hasMalla = progress.totalCred > 0;
  const [modo, setModo] = useState("horarios");

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
              <p className={styles.blockMuted}>Aún no tiene materias en "Cursando".</p>
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
              <p className={styles.blockMuted}>Todavía no tiene una malla guardada.</p>
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
        <div className={styles.comparadorCol}>
          <div className={styles.comparadorTabs}>
            <button
              className={`${styles.comparadorTab} ${modo === "horarios" ? styles.comparadorTabActive : ""}`}
              onClick={() => setModo("horarios")}>
              <IconSchedule size={13} /> Horarios
            </button>
            <button
              className={`${styles.comparadorTab} ${modo === "huecos" ? styles.comparadorTabActive : ""}`}
              onClick={() => setModo("huecos")}>
              <IconScale size={13} /> Huecos en común
            </button>
          </div>
          {modo === "horarios" ? (
            <ComparadorHorarios
              myHorario={myHorario}
              frHorario={frHorario}
              myMalla={myMalla}
              frMalla={frMalla}
              myName={myName}
              frName={nombre}
            />
          ) : (
            <ComparadorGrid myHorario={myHorario} frHorario={frHorario} />
          )}
        </div>
      </div>
    </section>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────
export default function ColaboracionView({ user, malla, horarioData, onNotify }) {
  const [users, setUsers] = useState(null);
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
    const loadUsers = async () => {
      const usersRes = await fetchUsersBrief();
      if (!active) return;
      if (usersRes.error) setLoadError(true);
      else setUsers(usersRes.data);
    };
    const loadFriendships = async () => {
      const friendshipsRes = await fetchFriendships(user.username);
      if (!active) return;
      if (friendshipsRes.missingTable) {
        setTableMissing(true);
        setFriendships({});
      } else if (friendshipsRes.error) {
        setLoadError(true);
        setFriendships({});
      } else {
        setLoadError(false);
        setTableMissing(false);
        setFriendships(friendshipsRes.data);
      }
      setLoading(false);
    };
    loadFriendships();
    loadUsers();
    return () => { active = false; };
  }, [user.username]);

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

  const userList = users || [];
  const amigos = userList.filter((u) => isFriend(u.username));
  const incoming = userList.filter((u) => isIncoming(u.username));
  const outgoing = userList.filter((u) => isOutgoing(u.username));

  const q = query.trim().toLowerCase();
  const searchResults = q
    ? userList.filter(
        (u) =>
          u.username !== user.username &&
          ((u.name || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q))
      )
    : [];

  const selectedProfile = userList.find((u) => u.username === selectedUser);
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
          <p className={styles.subtitle}>Agrega amigos, compara horarios y busca huecos libres para estudiar juntos</p>
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

          {!users && (
            <p className={styles.usersLoading}><span className={styles.loadingSpinner} /> Cargando lista de usuarios…</p>
          )}

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

          {!users ? (
            <p className={styles.usersLoading}><span className={styles.loadingSpinner} /> Cargando lista de usuarios…</p>
          ) : amigos.length === 0 ? (
            <div className={styles.friendsEmpty}>
              <span className={styles.friendsEmptyIcon}><IconUsers size={30} /></span>
              <p>Aún no tienes amigos.</p>
              <p className={styles.friendsEmptySub}>
                Busca a alguien arriba y envíale una solicitud para comparar horarios.
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
            myName={user.name || user.username}
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
