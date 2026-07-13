import { useState, useEffect } from "react";
import api from "../../api";
import "../css/Agenda.css";

const TIPOS = [
  { value: "pesagem",       label: "Pesagem" },
  { value: "vacina",        label: "Vacina" },
  { value: "vermifugacao",  label: "Vermifugação" },
  { value: "venda",         label: "Venda" },
  { value: "manejo",        label: "Manejo Geral" },
  { value: "outro",         label: "Outro" },
];

function Agenda({ setTela }) {
  const [eventos, setEventos] = useState([]);
  const [animais, setAnimais] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("pendentes");
  const [focusField, setFocusField] = useState(null);

  const [tipo, setTipo] = useState("pesagem");
  const [descricao, setDescricao] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [loteId, setLoteId] = useState("");
  const [tipoAlvo, setTipoAlvo] = useState("animal");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { buscarTudo(); }, []);

  async function buscarTudo() {
    setCarregando(true);
    try {
      const [resEv, resAni, resLotes] = await Promise.all([
        api.get("/agenda", { headers }),
        api.get("/animais", { headers }),
        api.get("/lotes", { headers }),
      ]);
      setEventos(resEv.data);
      setAnimais(resAni.data);
      setLotes(resLotes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriar() {
    setErro("");
    if (!tipo || !dataPrevista) { setErro("Tipo e data são obrigatórios."); return; }
    setLoading(true);
    try {
      await api.post("/agenda", {
        tipo, descricao, dataPrevista,
        animalId: tipoAlvo === "animal" ? animalId || null : null,
        loteId: tipoAlvo === "lote" ? loteId || null : null,
      }, { headers });
      setMostrarForm(false);
      setTipo("pesagem"); setDescricao(""); setDataPrevista(""); setAnimalId(""); setLoteId("");
      buscarTudo();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConcluir(id) {
    try {
      await api.patch(`/agenda/${id}/concluir`, {}, { headers });
      buscarTudo();
    } catch (err) { console.error(err); }
  }

  async function handleDeletar(id) {
    if (!window.confirm("Remover este evento?")) return;
    try {
      await api.delete(`/agenda/${id}`, { headers });
      buscarTudo();
    } catch (err) { console.error(err); }
  }

  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function statusEvento(ev) {
    if (ev.concluido) return "concluido";
    if (ev.dias_restantes < 0) return "atrasado";
    if (ev.dias_restantes <= 3) return "urgente";
    return "normal";
  }

  function getTipoInfo(val) {
    return TIPOS.find(t => t.value === val) || { label: val };
  }

  const pendentes = eventos.filter(e => !e.concluido);
  const concluidos = eventos.filter(e => e.concluido);
  const atrasados = pendentes.filter(e => e.dias_restantes < 0);
  const urgentes = pendentes.filter(e => e.dias_restantes >= 0 && e.dias_restantes <= 3);

  const filtrados = filtro === "pendentes" ? pendentes
    : filtro === "concluidos" ? concluidos
    : filtro === "atrasados" ? atrasados
    : eventos;

  return (
    <div className="agenda-root">
      <nav className="agenda-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">PM</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>Voltar</button>
      </nav>

      <div className="agenda-content">
        <div className="page-title">
          <div className="page-title-text">
            <h1>Agenda</h1>
            <p>{pendentes.length} evento(s) pendente(s)</p>
          </div>
          <button className="btn-novo" onClick={() => { setMostrarForm(!mostrarForm); setErro(""); }}>
            {mostrarForm ? "Fechar" : "+ Novo Evento"}
          </button>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{pendentes.length}</div>
            <div className="stat-label">Pendentes</div>
          </div>
          <div className={`stat-card${atrasados.length > 0 ? " alerta" : ""}`}>
            <div className="stat-value" style={{ color: atrasados.length > 0 ? "#e05252" : "#6daa28" }}>{atrasados.length}</div>
            <div className="stat-label">Atrasados</div>
          </div>
          <div className={`stat-card${urgentes.length > 0 ? " alerta-amarelo" : ""}`}>
            <div className="stat-value" style={{ color: urgentes.length > 0 ? "#e09a28" : "#6daa28" }}>{urgentes.length}</div>
            <div className="stat-label">Próximos 3 dias</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{concluidos.length}</div>
            <div className="stat-label">Concluídos</div>
          </div>
        </div>

        {/* FORM */}
        {mostrarForm && (
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-title">Novo Evento</span>
              <span className="form-badge">Agendar</span>
            </div>
            {erro && <div className="erro-box">{erro}</div>}

            {/* TIPO DE EVENTO */}
            <div className="tipos-grid">
              {TIPOS.map(t => (
                <button key={t.value} className={`tipo-btn${tipo === t.value ? " ativo" : ""}`} onClick={() => setTipo(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="form-row">
              <div className={`field-group${focusField === "data" ? " focused" : ""}`}>
                <label className="field-label">Data Prevista *</label>
                <div className="input-wrap">
                  <input className="agro-input" type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} onFocus={() => setFocusField("data")} onBlur={() => setFocusField(null)} />
                </div>
              </div>

              <div className={`field-group${focusField === "desc" ? " focused" : ""}`}>
                <label className="field-label">Descrição</label>
                <div className="input-wrap">
                  <input className="agro-input" placeholder="Detalhes do evento" value={descricao} onChange={e => setDescricao(e.target.value)} onFocus={() => setFocusField("desc")} onBlur={() => setFocusField(null)} />
                </div>
              </div>
            </div>

            {/* ALVO */}
            <div className="tipo-toggle" style={{ marginBottom: 16 }}>
              <button className={`tipo-btn${tipoAlvo === "animal" ? " ativo" : ""}`} onClick={() => setTipoAlvo("animal")}>Animal específico</button>
              <button className={`tipo-btn${tipoAlvo === "lote" ? " ativo" : ""}`} onClick={() => setTipoAlvo("lote")}>Lote</button>
              <button className={`tipo-btn${tipoAlvo === "geral" ? " ativo" : ""}`} onClick={() => setTipoAlvo("geral")}>Geral</button>
            </div>

            {tipoAlvo === "animal" && (
              <div className="field-group" style={{ marginBottom: 16 }}>
                <label className="field-label">Animal</label>
                <div className="input-wrap">
                  <select className="agro-input" style={{ paddingLeft: 14 }} value={animalId} onChange={e => setAnimalId(e.target.value)}>
                    <option value="">Selecione (opcional)</option>
                    {animais.map(a => <option key={a.id} value={a.id}>#{a.brinco} {a.raca ? `· ${a.raca}` : ""}</option>)}
                  </select>
                </div>
              </div>
            )}

            {tipoAlvo === "lote" && (
              <div className="field-group" style={{ marginBottom: 16 }}>
                <label className="field-label">Lote</label>
                <div className="input-wrap">
                  <select className="agro-input" style={{ paddingLeft: 14 }} value={loteId} onChange={e => setLoteId(e.target.value)}>
                    <option value="">Selecione (opcional)</option>
                    {lotes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                </div>
              </div>
            )}

            <button className="btn-salvar" onClick={handleCriar} disabled={loading}>
              <div className="btn-inner">{loading && <div className="spinner" />}{loading ? "Salvando..." : "Agendar"}</div>
            </button>
          </div>
        )}

        {/* FILTROS */}
        <div className="filtros">
          <button className={`filtro-btn${filtro === "pendentes" ? " ativo" : ""}`} onClick={() => setFiltro("pendentes")}>Pendentes ({pendentes.length})</button>
          <button className={`filtro-btn${filtro === "atrasados" ? " ativo" : ""}`} onClick={() => setFiltro("atrasados")}>Atrasados ({atrasados.length})</button>
          <button className={`filtro-btn${filtro === "concluidos" ? " ativo" : ""}`} onClick={() => setFiltro("concluidos")}>Concluídos ({concluidos.length})</button>
        </div>

        {/* LISTA */}
        <div className="lista-card">
          <div className="lista-header">
            <span className="lista-titulo">Eventos</span>
            <span className="lista-count">{filtrados.length} registros</span>
          </div>

          {carregando ? (
            <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum evento encontrado</p>
              <span>Clique em "+ Novo Evento" para agendar</span>
            </div>
          ) : (
            filtrados.map((ev, idx) => {
              const status = statusEvento(ev);
              const tipoInfo = getTipoInfo(ev.tipo);
              return (
                <div key={ev.id} className={`evento-item status-${status}`} style={{ animationDelay: `${idx * 0.04}s` }}>
                  <div className="evento-info">
                    <div className="evento-tipo">{tipoInfo.label}
                      {ev.brinco && <span className="evento-alvo"> · #{ev.brinco}</span>}
                      {ev.lote_nome && <span className="evento-alvo"> · {ev.lote_nome}</span>}
                    </div>
                    {ev.descricao && <div className="evento-desc">{ev.descricao}</div>}
                    <div className="evento-data">
                      {formatarData(ev.data_prevista)}
                      {!ev.concluido && (
                        <span className={`dias-badge ${status}`}>
                          {ev.dias_restantes < 0
                            ? `${Math.abs(ev.dias_restantes)}d atrasado`
                            : ev.dias_restantes === 0 ? "Hoje!"
                            : `em ${ev.dias_restantes}d`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="evento-acoes">
                    {!ev.concluido && (
                      <button className="btn-concluir" onClick={() => handleConcluir(ev.id)}>Concluir</button>
                    )}
                    <button className="btn-deletar" onClick={() => handleDeletar(ev.id)}>Remover</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Agenda;