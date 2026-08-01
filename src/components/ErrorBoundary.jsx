import React from "react";

// Barrera contra errores de render sin captura. Sin ella, cualquier error no
// controlado (p. ej. un chunk de React.lazy que falla al cargar) desmonta
// TODO el árbol y deja la pantalla en blanco con solo la aurora de fondo.
// Aquí se muestra un aviso amigable con botón de recarga en su lugar.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary capturó un error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isView = this.props.view; // variante "en el área principal" vs "pantalla completa"
    const card = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "14px",
      textAlign: "center",
      padding: "40px 20px",
      color: "var(--text)",
      fontFamily: "var(--font-body)",
    };
    return (
      <div
        style={
          isView
            ? card
            : {
                ...card,
                minHeight: "100vh",
                minHeight: "100dvh",
                background: "var(--bg)",
              }
        }
      >
        <span style={{ fontSize: "32px", color: "var(--accent)" }}>✦</span>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
          {this.props.title || "Algo salió mal"}
        </h2>
        <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", color: "var(--text-muted)" }}>
          {this.props.message ||
            "Ocurrió un error inesperado. Tus datos están guardados; recarga la página para continuar."}
        </p>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: "6px",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "var(--accent)",
            color: "var(--text)",
            fontSize: "13.5px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
