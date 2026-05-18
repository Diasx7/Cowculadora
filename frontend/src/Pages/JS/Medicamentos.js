import { useState, useEffect } from "react";
import api from "../../api";
import "../css/Medicamentos.css";

function Medicamentos({ setTela }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [animais, setAnimais] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [focusField, setFocusField] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  const [nome, setNome] = useState("");
  const [dose, setDose] = useState("");
  const [dataAplicacao, setDataAplicacao] = useState("");
  const [carenciaDias, setCarenciaDias] = useState("");
  const [observacao, setObservacao] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [loteId, setLoteId] = useState("");
  const [tipoAplicacao, setTipoAplicacao] = useState("animal");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    buscarTudo();
  }, []);

  async function buscarTudo() {
    setCarregando(true);
    try {
      const [resMed, resAni, resLotes] = await Promise.all([
        api.get("/medicamentos", { headers }),
        api.get("/animais", { headers }),
        api.get("/lotes", { headers }),
      ]);
      setMedicamentos(resMed.data);
      setAnimais(resAni.data);
      setLotes(resLotes.data);
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleRegistrar() {
    setErro(""); setSucesso("");
    if (!nome || !dataAplicacao) { setErro("Nome e data são obrigatórios."); return; }
    if (tipoAplicacao === "animal" && !animalId) { setErro("Selecione um animal."); return; }
    if (tipoAplicacao === "lote" && !loteId) { setErro("Selecione um lote."); return; }

    setLoading(true);
    try {
      await api.post("/medicamentos", {
        nome, dose, dataAplicacao,
        carenciaDias: carenciaDias || 0,
        observacao,
        animalId: tipoAplicacao === "animal" ? animalId : null,
        loteId: tipoAplicacao === "lote" ? loteId : null,
      }, { headers });
      setSucesso("Medicamento registrado!");
      setNome(""); setDose(""); setDataAplicacao(""); setCarenciaDias(""); setObservacao(""); setAnimalId(""); setLoteId("");
      setMostrarForm(false);
      buscarTudo();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao registrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletar(id) {
    if (!window.confirm("Remover este registro?")) return;
    try {
      await api.delete(`/medicamentos/${id}`, { headers });
      buscarTudo();
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  }

  function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  const emCarencia = medicamentos.filter(m => m.carencia_dias > 0 && m.dias_restantes_carencia > 0);
  const filtrados = filtro === "carencia" ? emCarencia : medicamentos;

  return (
    <div className="med-root">
      <nav className="med-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">⚖️</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>← Voltar</button>
      </nav>

      <div className="med-content">
        <div className="page-title">
          <div className="page-title-text">
            <h1>Medicamentos</h1>
            <p>{medicamentos.length} registro(s)</p>
          </div>
          <button className="btn-novo" onClick={() => { setMostrarForm(!mostrarForm); setErro(""); setSucesso(""); }}>
            {mostrarForm ? "✕ Fechar" : "+ Registrar"}
          </button>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">💊</div>
            <div className="stat-value">{medicamentos.length}</div>
            <div className="stat-label">Total aplicações</div>
          </div>
          <div className={`stat-card${emCarencia.length > 0 ? " alerta" : ""}`}>
            <div className="stat-icon">{emCarencia.length > 0 ? "⚠️" : "✅"}</div>
            <div className="stat-value" style={{ color: emCarencia.length > 0 ? "#e09a28" : "#6daa28" }}>{emCarencia.length}</div>
            <div className="stat-label">Em carência</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{medicamentos.filter(m => {
              const d = new Date(m.data_aplicacao);
              const hoje = new Date();
              return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
            }).length}</div>
            <div className="stat-label">Este mês</div>
          </div>
        </div>

        {/* FORM */}
        {mostrarForm && (
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-title">Registrar Aplicação</span>
              <span className="form-badge">Novo</span>
            </div>
            {erro && <div className="erro-box">⚠️ {erro}</div>}

            {/* TIPO */}
            <div className="tipo-toggle">
              <button className={`tipo-btn${tipoAplicacao === "animal" ? " ativo" : ""}`} onClick={() => setTipoAplicacao("animal")}>🐄 Por Animal</button>
              <button className={`tipo-btn${tipoAplicacao === "lote" ? " ativo" : ""}`} onClick={() => setTipoAplicacao("lote")}>🗂️ Por Lote</button>
            </div>

            <div className="form-row">
              <div className={`field-group${focusField === "nome" ? " focused" : ""}`}>
                <label className="field-label">Medicamento *</label>
                <div className="input-wrap">
                  <span className="input-icon">💊</span>
                  <input className="agro-input" placeholder="Ex: Ivermectina" value={nome} onChange={e => setNome(e.target.value)} onFocus={() => setFocusField("nome")} onBlur={() => setFocusField(null)} />
                </div>
              </div>

              <div className={`field-group${focusField === "dose" ? " focused" : ""}`}>
                <label className="field-label">Dose</label>
                <div className="input-wrap">
                  <span className="input-icon">💉</span>
                  <input className="agro-input" placeholder="Ex: 5ml/100kg" value={dose} onChange={e => setDose(e.target.value)} onFocus={() => setFocusField("dose")} onBlur={() => setFocusField(null)} />
                </div>
              </div>

              <div className={`field-group${focusField === "data" ? " focused" : ""}`}>
                <label className="field-label">Data de Aplicação *</label>
                <div className="input-wrap">
                  <span className="input-icon">📅</span>
                  <input className="agro-input" type="date" value={dataAplicacao} onChange={e => setDataAplicacao(e.target.value)} onFocus={() => setFocusField("data")} onBlur={() => setFocusField(null)} />
                </div>
              </div>

              <div className={`field-group${focusField === "carencia" ? " focused" : ""}`}>
                <label className="field-label">Carência (dias)</label>
                <div className="input-wrap">
                  <span className="input-icon">⏳</span>
                  <input className="agro-input" type="number" placeholder="Ex: 21" value={carenciaDias} onChange={e => setCarenciaDias(e.target.value)} onFocus={() => setFocusField("carencia")} onBlur={() => setFocusField(null)} />
                </div>
              </div>

              {tipoAplicacao === "animal" ? (
                <div className={`field-group${focusField === "animal" ? " focused" : ""}`}>
                  <label className="field-label">Animal *</label>
                  <div className="input-wrap">
                    <span className="input-icon">🐄</span>
                    <select className="agro-input" style={{ paddingLeft: "42px" }} value={animalId} onChange={e => setAnimalId(e.target.value)} onFocus={() => setFocusField("animal")} onBlur={() => setFocusField(null)}>
                      <option value="">Selecione</option>
                      {animais.map(a => <option key={a.id} value={a.id}>#{a.brinco} {a.raca ? `· ${a.raca}` : ""}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className={`field-group${focusField === "lote" ? " focused" : ""}`}>
                  <label className="field-label">Lote *</label>
                  <div className="input-wrap">
                    <span className="input-icon">🗂️</span>
                    <select className="agro-input" style={{ paddingLeft: "42px" }} value={loteId} onChange={e => setLoteId(e.target.value)} onFocus={() => setFocusField("lote")} onBlur={() => setFocusField(null)}>
                      <option value="">Selecione</option>
                      {lotes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className={`field-group${focusField === "obs" ? " focused" : ""}`}>
                <label className="field-label">Observação</label>
                <div className="input-wrap">
                  <span className="input-icon">📝</span>
                  <input className="agro-input" placeholder="Observações adicionais" value={observacao} onChange={e => setObservacao(e.target.value)} onFocus={() => setFocusField("obs")} onBlur={() => setFocusField(null)} />
                </div>
              </div>
            </div>

            <button className="btn-salvar" onClick={handleRegistrar} disabled={loading}>
              <div className="btn-inner">{loading && <div className="spinner" />}{loading ? "Salvando..." : "Registrar"}</div>
            </button>
          </div>
        )}

        {sucesso && !mostrarForm && <div className="sucesso-box">✅ {sucesso}</div>}

        {/* FILTROS */}
        <div className="filtros">
          <button className={`filtro-btn${filtro === "todos" ? " ativo" : ""}`} onClick={() => setFiltro("todos")}>Todos ({medicamentos.length})</button>
          <button className={`filtro-btn${filtro === "carencia" ? " ativo" : ""}`} onClick={() => setFiltro("carencia")}>⚠️ Em carência ({emCarencia.length})</button>
        </div>

        {/* LISTA */}
        <div className="lista-card">
          <div className="lista-header">
            <span className="lista-titulo">Histórico</span>
            <span className="lista-count">{filtrados.length} registros</span>
          </div>

          {carregando ? (
            <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💊</div>
              <p>Nenhum registro encontrado</p>
              <span>Clique em "+ Registrar" para começar</span>
            </div>
          ) : (
            filtrados.map((m, idx) => (
              <div key={m.id} className="med-item" style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="med-item-left">
                  <div className="med-avatar">💊</div>
                  <div>
                    <div className="med-nome">{m.nome}</div>
                    <div className="med-detalhes">
                      {m.brinco && <span>🐄 #{m.brinco}</span>}
                      {m.lote_nome && <span>🗂️ {m.lote_nome}</span>}
                      {m.dose && <span>💉 {m.dose}</span>}
                      <span>📅 {formatarData(m.data_aplicacao)}</span>
                    </div>
                    {m.carencia_dias > 0 && (
                      <div className={`carencia-tag ${m.dias_restantes_carencia > 0 ? "ativa" : "encerrada"}`}>
                        {m.dias_restantes_carencia > 0
                          ? `⏳ Carência: ${m.dias_restantes_carencia} dia(s) restante(s) · até ${formatarData(m.data_fim_carencia)}`
                          : `✅ Carência encerrada em ${formatarData(m.data_fim_carencia)}`}
                      </div>
                    )}
                    {m.observacao && <div className="med-obs">📝 {m.observacao}</div>}
                  </div>
                </div>
                <button className="btn-deletar" onClick={() => handleDeletar(m.id)}>🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Medicamentos;