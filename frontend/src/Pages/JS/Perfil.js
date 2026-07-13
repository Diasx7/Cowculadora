import { useEffect, useState } from "react";
import api from "../../api";
import "../css/Perfil.css";

function Perfil({ setTela }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/perfil", { headers: { Authorization: "Bearer " + token } });
        setDados(res.data.usuario);
      } catch (err) {
        alert("Sessão expirada. Faça login novamente.");
        setTela("login");
      } finally {
        setLoading(false);
      }
    }
    carregarPerfil();
  }, [setTela]);

  function logout() {
    localStorage.removeItem("token");
    setTela("login");
  }

  const initials = dados?.nome
    ? dados.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : dados?.email?.[0]?.toUpperCase() ?? "?";

  // unico lugar do app que mantem emoji - o resto foi removido de proposito
  const actions = [
    { icon: "⚖️", title: "Nova Pesagem",  sub: "Registrar peso",      acao: () => setTela("pesagem") },
    { icon: "🐂", title: "Pesagem de Lote", sub: "Sessão em massa",  acao: () => setTela("sessaoPesagem") },
    { icon: "📊", title: "Relatórios",    sub: "Ver dashboard",       acao: () => setTela("dashboard") },
    { icon: "🐄", title: "Rebanho",       sub: "Gerenciar animais",   acao: () => setTela("animais") },
    { icon: "🗂️", title: "Lotes",         sub: "Organizar rebanho",   acao: () => setTela("lotes") },
    { icon: "💊", title: "Medicamentos",  sub: "Saúde do rebanho",    acao: () => setTela("medicamentos") },
    { icon: "💰", title: "Financeiro",    sub: "Valor e projeções",   acao: () => setTela("financeiro") },
    { icon: "📅", title: "Agenda",        sub: "Manejo e eventos",    acao: () => setTela("agenda") },
    { icon: "🌾", title: "Insumos",       sub: "Ração e consumo",     acao: () => setTela("insumos") },
  ];

  return (
    <div className="agro-root">
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">PM</div>
          <div className="nav-brand-name">PesoMax</div>
        </div>
        <button className="btn-logout" onClick={logout}>Sair</button>
      </nav>

      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-row">
            <div className={`avatar-circle${loading ? " avatar-skeleton" : ""}`}>
              {!loading && initials}
            </div>
            <div className="avatar-info">
              {loading ? (
                <>
                  <div className="skeleton" style={{ width: 160, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 80 }} />
                </>
              ) : (
                <>
                  <h3>{dados?.nome ?? "Produtor"}</h3>
                  <div className="role-tag">Produtor Rural</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="profile-body">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
            </div>
          ) : (
            <>
              <div className="status-row">
                <div className="status-dot" />
                <span className="status-text">Sessão ativa · Balança online</span>
              </div>
              <div className="section-label">Dados da conta</div>
              <div className="data-grid">
                <div className="data-item">
                  <div className="data-item-label">ID</div>
                  <div className="data-item-value">#{String(dados?.id).padStart(5, "0")}</div>
                </div>
                <div className="data-item">
                  <div className="data-item-label">Status</div>
                  <div className="data-item-value" style={{ color: "#6daa28" }}>Ativo</div>
                </div>
              </div>
              <div className="section-label">Acesso rápido</div>
              <div className="actions-grid">
                {actions.map((a) => (
                  <button key={a.title} className="action-btn" onClick={a.acao}>
                    <div className="action-icon">{a.icon}</div>
                    <div className="action-text">
                      <strong>{a.title}</strong>
                      <span>{a.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="bottom-badge">© 2025 PesoMax · Todos os direitos reservados</div>
    </div>
  );
}

export default Perfil;