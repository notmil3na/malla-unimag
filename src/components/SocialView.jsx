import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import styles from "./SocialView.module.css";

export default function SocialView({ user }) {
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [relations, setRelations] = useState([]);
  const [loadingRelations, setLoadingRelations] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const myUsername = user.username;

  const incoming = useMemo(
    () => relations.filter((r) => r.status === "pending" && r.addressee_username === myUsername),
    [relations, myUsername]
  );
  const outgoing = useMemo(
    () => relations.filter((r) => r.status === "pending" && r.requester_username === myUsername),
    [relations, myUsername]
  );
  const friends = useMemo(
    () => relations.filter((r) => r.status === "accepted"),
    [relations]
  );

  const friendName = (r) =>
    r.requester_username === myUsername ? r.addressee_username : r.requester_username;

  const clearInfo = () => {
    setMsg("");
    setErr("");
  };

  const loadRelations = async () => {
    setLoadingRelations(true);
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_username.eq.${myUsername},addressee_username.eq.${myUsername}`)
      .order("created_at", { ascending: false });

    if (error) {
      setErr("No pude cargar amistades. Verifica la tabla friendships en Supabase.");
      setRelations([]);
    } else {
      setRelations(data || []);
    }
    setLoadingRelations(false);
  };

  useEffect(() => {
    loadRelations();
  }, [myUsername]);

  const handleSearch = async (e) => {
    e.preventDefault();
    clearInfo();
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("username, name, career")
      .ilike("username", `%${q}%`)
      .neq("username", myUsername)
      .limit(8);
    setSearchLoading(false);

    if (error) {
      setErr("No pude buscar usuarios.");
      setSearchResults([]);
      return;
    }
    setSearchResults(data || []);
  };

  const hasRelationWith = (username) =>
    relations.find(
      (r) =>
        (r.requester_username === myUsername && r.addressee_username === username) ||
        (r.requester_username === username && r.addressee_username === myUsername)
    );

  const sendRequest = async (targetUsername) => {
    clearInfo();
    const existing = hasRelationWith(targetUsername);
    if (existing) {
      if (existing.status === "accepted") setMsg("Ya son amigos.");
      else if (existing.status === "pending" && existing.addressee_username === myUsername) {
        setMsg("Ese usuario ya te envió solicitud. Acéptala en solicitudes recibidas.");
      } else {
        setMsg("Ya existe una solicitud pendiente entre ambos.");
      }
      return;
    }

    const { error } = await supabase.from("friendships").insert({
      requester_username: myUsername,
      addressee_username: targetUsername,
      status: "pending",
    });

    if (error) {
      setErr("No se pudo enviar la solicitud.");
      return;
    }
    setMsg("Solicitud enviada.");
    await loadRelations();
  };

  const respondRequest = async (id, status) => {
    clearInfo();
    const { error } = await supabase.from("friendships").update({ status }).eq("id", id);
    if (error) {
      setErr("No se pudo actualizar la solicitud.");
      return;
    }
    setMsg(status === "accepted" ? "Solicitud aceptada." : "Solicitud rechazada.");
    await loadRelations();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>Amigos</h2>
        <p className={styles.subtitle}>Conecta con otros usuarios de MiMalla</p>
      </div>

      <form className={styles.searchBox} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuario"
        />
        <button className={styles.searchBtn} type="submit" disabled={searchLoading}>
          {searchLoading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {msg && <p className={styles.msg}>{msg}</p>}
      {err && <p className={styles.err}>{err}</p>}

      {searchResults.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Resultados</h3>
          <div className={styles.list}>
            {searchResults.map((u) => {
              const relation = hasRelationWith(u.username);
              return (
                <div key={u.username} className={styles.item}>
                  <div>
                    <p className={styles.itemName}>{u.name || u.username}</p>
                    <p className={styles.itemSub}>@{u.username} · {u.career || "Sin carrera"}</p>
                  </div>
                  <button
                    className={styles.actionBtn}
                    onClick={() => sendRequest(u.username)}
                    disabled={!!relation}
                  >
                    {relation ? "Relacionado" : "Agregar"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Solicitudes recibidas ({incoming.length})</h3>
        <div className={styles.list}>
          {incoming.length === 0 && <p className={styles.empty}>Sin solicitudes recibidas.</p>}
          {incoming.map((r) => (
            <div key={r.id} className={styles.item}>
              <div>
                <p className={styles.itemName}>@{r.requester_username}</p>
                <p className={styles.itemSub}>Quiere agregarte</p>
              </div>
              <div className={styles.actions}>
                <button className={styles.acceptBtn} onClick={() => respondRequest(r.id, "accepted")}>Aceptar</button>
                <button className={styles.rejectBtn} onClick={() => respondRequest(r.id, "rejected")}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Solicitudes enviadas ({outgoing.length})</h3>
        <div className={styles.list}>
          {outgoing.length === 0 && <p className={styles.empty}>No has enviado solicitudes.</p>}
          {outgoing.map((r) => (
            <div key={r.id} className={styles.item}>
              <div>
                <p className={styles.itemName}>@{r.addressee_username}</p>
                <p className={styles.itemSub}>Pendiente</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Amigos ({friends.length})</h3>
        <div className={styles.list}>
          {loadingRelations && <p className={styles.empty}>Cargando...</p>}
          {!loadingRelations && friends.length === 0 && <p className={styles.empty}>Aún no tienes amigos.</p>}
          {friends.map((r) => (
            <div key={r.id} className={styles.item}>
              <div>
                <p className={styles.itemName}>@{friendName(r)}</p>
                <p className={styles.itemSub}>Conectado contigo</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
