import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import styles from "./ChatView.module.css";
import {
  IconSend, IconPaperclip, IconArrowLeft, IconDownload,
  IconSparkle, IconGrades, IconClipboard, IconImage, IconUser,
} from "./Icons";
import { usePhoto } from "../utils/photo";
import { fetchConversations, fetchThread, sendMessage, markRead } from "../utils/chatApi";
import {
  buildApuntesPayload, buildNotasPayload, buildAsignacionesPayload,
  apuntesToText, notasToText, asignacionesToText,
  downloadText, compressImageForChat,
} from "../utils/chatShare";

const POLL_MS = 3000;

function fmtTimeFull(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    if (sameDay) return `${hh}:${mm}`;
    const dd = d.getDate().toString().padStart(2, "0");
    const MM = (d.getMonth() + 1).toString().padStart(2, "0");
    if (d.getFullYear() === today.getFullYear()) return `${dd}/${MM} · ${hh}:${mm}`;
    return `${dd}/${MM}/${d.getFullYear()} · ${hh}:${mm}`;
  } catch {
    return "";
  }
}

function Avatar({ u, size = 40 }) {
  const username = u?.username || "";
  const initial = ((u?.name || username || "?").trim()[0] || "?").toUpperCase();
  const photo = usePhoto(username, !!u?.hasPhoto);
  const style = { width: size, height: size };
  if (photo) {
    return (
      <div className={styles.avatar} style={style}>
        <img src={photo} alt="" className={styles.avatarImg} />
      </div>
    );
  }
  return (
    <div className={styles.avatar} style={style}>
      <span>{initial}</span>
    </div>
  );
}

function kindLabel(payload) {
  const kind = payload && payload.kind;
  if (kind === "apuntes") return "📒 Apuntes";
  if (kind === "notas") return "📊 Notas del semestre";
  if (kind === "asignaciones") return "🗓 Asignaciones";
  if (kind === "imagen") return "Imagen";
  return "Mensaje";
}

// ── Tarjeta de resumen (iMessage bubble content) ──────────────────────────
function ShareCard({ payload, mine }) {
  const kind = payload && payload.kind;
  const [expanded, setExpanded] = useState(false);
  const list = useMemo(() => {
    if (kind === "apuntes") return payload.materias || [];
    if (kind === "notas") return payload.materias || [];
    if (kind === "asignaciones") return payload.items || [];
    return [];
  }, [kind, payload]);

  const header = () => {
    if (kind === "apuntes") return `${payload.total ?? list.reduce((a, e) => a + (e.apuntes || []).length, 0)} apuntes`;
    if (kind === "notas") {
      const s = payload.estadisticas || {};
      return `${s.aprob || 0} aprobadas · ${s.cursando || 0} en curso`;
    }
    if (kind === "asignaciones") return `${payload.pendientes ?? 0} pendientes · ${payload.completadas ?? 0} completadas`;
    return "";
  };

  return (
    <div className={styles.shareCard}>
      <div className={styles.shareHead}>
        <span className={styles.shareEmoji}>✦</span>
        <span className={styles.shareTitulo}>{payload.titulo || kindLabel(payload)}</span>
      </div>
      {kind === "notas" && payload.ponderado != null && (
        <div className={styles.sharePond}>
          Ponderado: <strong>{payload.ponderado}</strong>
        </div>
      )}
      <div className={styles.shareResumen}>{header()}</div>

      {expanded && (
        <div className={styles.shareBody}>
          {kind === "apuntes" && list.map((mat, i) => (
            <div key={i} className={styles.shareBlock}>
              <div className={styles.shareBlockTitle}>{mat.materia} · {mat.apuntes.length}</div>
              {(mat.apuntes || []).map((a, j) => (
                <div key={j} className={styles.shareItem}>
                  <span className={styles.shareItemTag}>{fmtTimeFull(a.fecha)}</span>
                  <span className={styles.shareItemText}>{a.texto}</span>
                </div>
              ))}
            </div>
          ))}
          {kind === "notas" && list.map((m, i) => (
            <div key={i} className={styles.shareRow}>
              <span className={styles.shareRowId}>{m.id}</span>
              <span className={styles.shareRowEstado}>{m.estado}</span>
              <span className={styles.shareRowNota}>{m.nota}</span>
            </div>
          ))}
          {kind === "asignaciones" && list.map((it, i) => (
            <div key={i} className={styles.shareRow}>
              <span className={styles.shareRowId}>{it.tipo}</span>
              <span className={styles.shareRowTxt}>{it.titulo || it.tipo} · {it.materiaId}</span>
              <span className={styles.shareRowNota}>{fmtTimeFull(it.fecha)}</span>
            </div>
          ))}
        </div>
      )}

      <button className={`${styles.shareToggle} ${mine ? styles.shareToggleMine : ""}`} onClick={() => setExpanded(v => !v)}>
        {expanded ? "Mostrar menos" : `Ver resumen (${list.length})`}
      </button>
    </div>
  );
}

function MessageBubble({ msg, mine, friendName }) {
  const payload = msg.payload || {};
  const kind = payload.kind || "texto";

  const handleDownload = () => {
    let text = "", filename = "";
    if (kind === "apuntes") { text = apuntesToText(payload); filename = "apuntes.txt"; }
    else if (kind === "notas") { text = notasToText(payload); filename = "notas-semestre.txt"; }
    else if (kind === "asignaciones") { text = asignacionesToText(payload); filename = "asignaciones.txt"; }
    if (text) downloadText(filename, text);
  };

  return (
    <div className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ""}`}>
      {!mine && (
        <div className={styles.bubbleAvatar}>
          <Avatar u={{ username: msg.sender }} size={26} />
        </div>
      )}
      <div className={`${styles.bubble} ${mine ? styles.bubbleMine : ""} ${styles["bubble_" + (kind === "imagen" ? "imagen" : kind)]}`}>
        {kind === "texto" && <div className={styles.bubbleText}>{payload.texto}</div>}

        {kind === "imagen" && (
          <div className={styles.bubbleImgWrap}>
            <img src={payload.url} alt={payload.nombre || "Imagen adjunta"} className={styles.bubbleImg} />
            {payload.nombre && <div className={styles.bubbleImgName}>{payload.nombre}</div>}
          </div>
        )}

        {(kind === "apuntes" || kind === "notas" || kind === "asignaciones") && (
          <div className={styles.bubbleShare}>
            <div className={styles.bubbleShareRow}>
              <span className={styles.bubbleShareKind}>{kindLabel(payload)}</span>
              {(kind === "apuntes" || kind === "notas" || kind === "asignaciones") && (
                <button className={styles.bubbleDownload} onClick={handleDownload} title="Descargar">
                  <IconDownload size={13} />
                </button>
              )}
            </div>
            <ShareCard payload={payload} mine={mine} />
          </div>
        )}

        <div className={`${styles.bubbleMeta} ${mine ? styles.bubbleMetaMine : ""}`}>
          {fmtTimeFull(msg.created_at)}
          {mine && <span className={`${styles.check} ${msg.read ? styles.checkRead : ""}`}>✓✓</span>}
        </div>
      </div>
    </div>
  );
}

// ── Compartir / adjuntar ───────────────────────────────────────────────────
function ShareMenu({ onSend, myName, shareData }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const selectOptions = [
    { key: "apuntes", label: "Mis apuntes", desc: "Apuntes por materia", icon: <IconSparkle size={15} /> },
    { key: "notas", label: "Notas del semestre", desc: "Resumen y ponderado", icon: <IconGrades size={15} /> },
    { key: "asignaciones", label: "Mis asignaciones", desc: "Pendientes y fechas", icon: <IconClipboard size={15} /> },
  ];

  const choose = async (key) => {
    setOpen(false);
    setBusy(true);
    try {
      let payload = null;
      if (key === "apuntes") payload = buildApuntesPayload(shareData.malla, shareData.notasClaseData);
      if (key === "notas") payload = buildNotasPayload({ malla: shareData.malla, notas: shareData.notas, semestre: shareData.semestre });
      if (key === "asignaciones") payload = buildAsignacionesPayload({ malla: shareData.malla, asignacionesData: shareData.asignacionesData });
      if (payload) await onSend(payload);
    } finally {
      setBusy(false);
    }
  };

  const pickImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = reader.result;
        const comp = await compressImageForChat(raw);
        setOpen(false);
        await onSend({ kind: "imagen", url: comp, nombre: file.name || "imagen" });
        setBusy(false);
      };
      reader.readAsDataURL(file);
    } catch (_) {
      setBusy(false);
    }
  };

  return (
    <div className={styles.shareMenuWrap}>
      <button className={styles.paperclip} onClick={() => setOpen(v => !v)} title="Compartir o adjuntar" disabled={busy}>
        {busy ? <span className={styles.busyDot} /> : <IconPaperclip size={17} />}
      </button>
      {open && (
        <>
          <div className={styles.shareBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.sharePopover}>
            <div className={styles.sharePopTitle}>Compartir con {myName}</div>
            {selectOptions.map((o) => (
              <button key={o.key} className={styles.shareOpt} onClick={() => choose(o.key)} disabled={busy}>
                <span className={styles.shareOptIcon}>{o.icon}</span>
                <span className={styles.shareOptTxt}>
                  <span className={styles.shareOptLabel}>{o.label}</span>
                  <span className={styles.shareOptDesc}>{o.desc}</span>
                </span>
              </button>
            ))}
            <button className={styles.shareOpt} onClick={() => fileRef.current.click()} disabled={busy}>
              <span className={styles.shareOptIcon}><IconImage size={15} /></span>
              <span className={styles.shareOptTxt}>
                <span className={styles.shareOptLabel}>Enviar imagen</span>
                <span className={styles.shareOptDesc}>Adjuntar una foto del dispositivo</span>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickImage} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Conversación (thread) ──────────────────────────────────────────────────
function ThreadView({ user, friend, onBack, onNotify, shareData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsMig, setNeedsMig] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const lastAppliedRef = useRef(null);

  const me = user.username;
  const friendU = friend.username;

  const load = useCallback(async () => {
    const res = await fetchThread(friendU);
    if (res.needsMigration) { setNeedsMig(true); setLoading(false); return; }
    setNeedsMig(false);
    setMessages(res.data);
    setLoading(false);
  }, [friendU]);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setLoading(true);
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [friendU, load]);

  // Auto-scroll al final cuando cambian los mensajes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Marcar como leídos los mensajes del amigo, una sola vez por lote nuevo.
  useEffect(() => {
    const unreadMe = messages.filter((m) => m.sender === friendU && !m.read);
    if (unreadMe.length === 0) return;
    const key = unreadMe.map((m) => m.id).join(",");
    if (lastAppliedRef.current === key) return;
    lastAppliedRef.current = key;
    markRead(friendU).then(() => load());
  }, [messages, friendU, load]);

  const send = async (payload) => {
    if (!payload) return;
    const res = await sendMessage(friendU, payload);
    if (res.needsMigration) { setNeedsMig(true); return; }
    if (!res.ok) { onNotify(res.error || "No se pudo enviar el mensaje"); return; }
    load();
  };

  const handleSendText = async () => {
    const texto = input.trim();
    if (!texto || sending) return;
    setSending(true);
    setTyping(false);
    await send({ kind: "texto", texto });
    setInput("");
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  if (needsMig) {
    return (
      <div className={styles.threadEmpty}>
        <span className={styles.threadEmptyIcon}><IconSparkle size={26} /></span>
        <p>El chat aún no está activado.</p>
        <p className={styles.threadEmptySub}>Aplica la migración del chat para empezar a usarlo.</p>
        <button className={styles.backToFriends} onClick={onBack}><IconArrowLeft size={14} /> Volver a amigos</button>
      </div>
    );
  }

  return (
    <div className={styles.thread}>
      <div className={styles.threadHeader}>
        <button className={styles.threadBack} onClick={onBack} title="Volver"><IconArrowLeft size={17} /></button>
        <Avatar u={friend} size={34} />
        <div className={styles.threadHeadInfo}>
          <span className={styles.threadName}>{friend.name || friend.username}</span>
          <span className={styles.threadStatus}>{typing ? "escribiendo…" : "en línea"}</span>
        </div>
      </div>

      <div className={styles.threadBody} ref={scrollRef}>
        {loading ? (
          <div className={styles.threadEmpty}><span className={styles.loadingSpinner} /> Cargando conversación…</div>
        ) : messages.length === 0 ? (
          <div className={styles.threadEmpty}>
            <span className={styles.threadEmptyIcon}><IconSparkle size={26} /></span>
            <p>Este es el inicio de tu conversación.</p>
            <p className={styles.threadEmptySub}>Saluda a {friend.name || "@" + friendU} y comparte apuntes, notas o asignaciones.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} mine={msg.sender === me} friendName={friend.name} />
          ))
        )}
      </div>

      <div className={styles.composer}>
        <ShareMenu onSend={(p) => send(p)} myName={friend.name || friendU} shareData={shareData} />
        <textarea
          className={styles.composerInput}
          rows={1}
          value={input}
          placeholder="Mensaje…"
          onChange={(e) => { setInput(e.target.value); setTyping(e.target.value.length > 0); }}
          onKeyDown={handleKey}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSendText}
          disabled={!input.trim() || sending}
          title="Enviar"
        >
          <IconSend size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Conversaciones (lista) ─────────────────────────────────────────────────
export default function ChatView({ user, amigos, onBack, onNotify, shareData }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsMig, setNeedsMig] = useState(false);
  const [active, setActive] = useState(null);

  const amigoInfo = useMemo(() => {
    const map = {};
    (amigos || []).forEach((u) => { map[u.username] = u; });
    return map;
  }, [amigos]);

  const load = useCallback(async () => {
    const res = await fetchConversations();
    if (res.needsMigration) { setNeedsMig(true); setLoading(false); return; }
    setNeedsMig(false);
    setConversations(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Combina las conversaciones con el último mensaje para la lista.
  const sorted = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ta = a.last ? a.last.created_at : "";
      const tb = b.last ? b.last.created_at : "";
      return (ta < tb ? 1 : ta > tb ? -1 : 0);
    });
  }, [conversations]);

  const unreadTotal = conversations.reduce((a, c) => a + (c.unread || 0), 0);

  if (needsMig) {
    return (
      <div className={styles.chatWrap}>
        <Header title="Chat" count={0} onBack={onBack} />
        <div className={styles.chatEmpty}>
          <span className={styles.threadEmptyIcon}><IconSparkle size={26} /></span>
          <p>El chat aún no está activado.</p>
          <p className={styles.threadEmptySub}>Aplica la migración del chat para empezar a usar esta función.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWrap}>
      <Header title="Chat" count={unreadTotal} onBack={onBack} />

      {active ? (
        <ThreadView
          user={user}
          friend={amigoInfo[active] || { username: active, name: active }}
          onBack={() => { setActive(null); load(); }}
          onNotify={onNotify}
          shareData={shareData}
        />
      ) : (
        <div className={styles.convList}>
          {loading ? (
            <div className={styles.chatEmpty}><span className={styles.loadingSpinner} /> Cargando conversaciones…</div>
          ) : amigos.length === 0 ? (
            <div className={styles.chatEmpty}>
              <span className={styles.threadEmptyIcon}><IconUser size={26} /></span>
              <p>Agrega amigos para chatear.</p>
              <p className={styles.threadEmptySub}>Solo puedes conversar con personas que ya son tus amigos.</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.chatEmpty}>
              <span className={styles.threadEmptyIcon}><IconUser size={26} /></span>
              <p>No tienes conversaciones todavía.</p>
              <p className={styles.threadEmptySub}>Toca a un amigo para iniciar un chat.</p>
            </div>
          ) : (
            sorted.map((c) => {
              const u = amigoInfo[c.partner] || { username: c.partner, name: c.partner };
              const lastKind = c.last ? c.last.kind : "texto";
              const preview =
                c.last
                  ? (lastKind === "texto" ? "Mensaje"
                     : lastKind === "imagen" ? "📷 Imagen"
                     : lastKind === "apuntes" ? "📒 Compartió apuntes"
                     : lastKind === "notas" ? "📊 Compartió notas del semestre"
                     : lastKind === "asignaciones" ? "🗓 Compartió asignaciones"
                     : "Mensaje")
                  : "Inicia una conversación";
              return (
                <button key={c.partner} className={styles.convRow} onClick={() => setActive(c.partner)}>
                  <span className={styles.convAvatar}>
                    <Avatar u={u} size={46} />
                    {c.unread > 0 && <span className={styles.convUnreadBadge}>{c.unread}</span>}
                  </span>
                  <span className={styles.convInfo}>
                    <span className={styles.convTop}>
                      <span className={styles.convName}>{u.name || u.username}</span>
                      {c.last && <span className={styles.convTime}>{fmtTimeFull(c.last.created_at)}</span>}
                    </span>
                    <span className={styles.convPreview}>{preview}</span>
                  </span>
                  <span className={styles.convChevron}>›</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Header({ title, count, onBack }) {
  return (
    <div className={styles.chatHeader}>
      <button className={styles.threadBack} onClick={onBack} title="Volver a amigos"><IconArrowLeft size={17} /></button>
      <div className={styles.chatHeaderTitle}>
        <span>{title}</span>
        {count > 0 && <span className={styles.chatHeaderCount}>{count}</span>}
      </div>
    </div>
  );
}
