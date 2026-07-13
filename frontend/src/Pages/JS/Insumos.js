import { useState, useEffect } from "react";
import api from "../../api";
import "../css/Insumos.css";

const UNIDADES = ["kg", "g", "L", "mL", "saco", "fardo", "ton", "unidade"];

function Insumos({ setTela }) {
  const [insumos, setInsumos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [animais, setAnimais] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState("consumos");
  const [mostrarFormInsumo, setMostrarFormInsumo] = useState(false);
  const [mostrarFormConsumo, setMostrarFormConsumo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [focusField, setFocusField] = useState(null);

  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("kg");
  const [precoUnitario, setPrecoUnitario] = useState("");

  const [insumoId, setInsumoId] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [loteId, setLoteId] = useState("");
  const [quantidadeDia, setQuantidadeDia] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [tipoAlvo, setTipoAlvo] = useState("animal");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { buscarTudo(); }, []);

  async function buscarTudo() {
    setCarregando(true);
    try {
      const [resIns, resCons, resAni, resLotes] = await Promise.all([
        api.get("/insumos", { headers }),
        api.get("/insumos/consumo", { headers }),
        api.get("/animais", { headers }),
        api.get("/lotes", { headers }),
      ]);
      setInsumos(resIns.data);
      setConsumos(resCons.data);
      setAnimais(resAni.data);
      setLotes(resLotes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCriarInsumo() {
    setErro("");
    if (!nome || !unidade || !precoUnitario) { setErro("Todos os campos são obrigatórios."); return; }
    setLoading(true);
    try {
      await api.post("/insumos", { nome, unidade, precoUnitario }, { headers });
      setNome(""); setUnidade("kg"); setPrecoUnitario("");
      setMostrarFormInsumo(false);
      buscarTudo();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistrarConsumo() {
    setErro("");
    if (!insumoId || !quantidadeDia || !dataInicio) { setErro("Insumo, quantidade e data início são obrigatórios."); return; }
    setLoading(true);
    try {
      await api.post("/insumos/consumo", {
        insumoId, quantidadeDia, dataInicio, dataFim, observacao,
        animalId: tipoAlvo === "animal" ? animalId || null : null,
        loteId: tipoAlvo === "lote" ? loteId || null : null,
      }, { headers });
      setInsumoId(""); setQuantidadeDia(""); setDataInicio(""); setDataFim(""); setObservacao(""); setAnimalId(""); setLoteId("");
      setMostrarFormConsumo(false);
      buscarTudo();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao registrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletarInsumo(id) {
    if (!window.confirm("Remover este insumo?")) return;
    try { await api.delete(`/insumos/${id}`, { headers }); buscarTudo(); }
    catch (err) { console.error(err); }
  }

  async function handleDeletarConsumo(id) {
    if (!window.confirm("Remover este registro?")) return;
    try { await api.delete(`/insumos/consumo/${id}`, { headers }); buscarTudo(); }
    catch (err) { console.error(err); }
  }

  function formatarMoeda(val) {
    if (!val) return "—";
    return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  const custoTotal = consumos.reduce((acc, c) => acc + Number(c.custo_total || 0), 0);

  return (
    <div className="ins-root">
      <nav className="ins-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">PM</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>Voltar</button>
      </nav>

      <div className="ins-content">
        <div className="page-title">
          <div className="page-title-text">
            <h1>Insumos</h1>
            <p>Ração, silagem e outros</p>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{insumos.length}</div>
            <div className="stat-label">Tipos cadastrados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{consumos.length}</div>
            <div className="stat-label">Registros de consumo</div>
          </div>
          <div className="stat-card">
            <div className="stat-value-small">{formatarMoeda(custoTotal)}</div>
            <div className="stat-label">Custo total</div>
          </div>
        </div>

        {/* ABAS */}
        <div className="abas">
          <button className={`aba-btn${aba === "consumos" ? " ativo" : ""}`} onClick={() => setAba("consumos")}>Consumos</button>
          <button className={`aba-btn${aba === "insumos" ? " ativo" : ""}`} onClick={() => setAba("insumos")}>Insumos Cadastrados</button>
        </div>

        {/* ABA INSUMOS */}
        {aba === "insumos" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button className="btn-novo" onClick={() => { setMostrarFormInsumo(!mostrarFormInsumo); setErro(""); }}>
                {mostrarFormInsumo ? "Fechar" : "+ Novo Insumo"}
              </button>
            </div>

            {mostrarFormInsumo && (
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-title">Cadastrar Insumo</span>
                  <span className="form-badge">Novo</span>
                </div>
                {erro && <div className="erro-box">{erro}</div>}
                <div className="form-row">
                  <div className={`field-group${focusField === "nome" ? " focused" : ""}`}>
                    <label className="field-label">Nome *</label>
                    <div className="input-wrap">
                      <input className="agro-input" placeholder="Ex: Ração, Silagem" value={nome} onChange={e => setNome(e.target.value)} onFocus={() => setFocusField("nome")} onBlur={() => setFocusField(null)} />
                    </div>
                  </div>
                  <div className={`field-group${focusField === "unidade" ? " focused" : ""}`}>
                    <label className="field-label">Unidade *</label>
                    <div className="input-wrap">
                      <select className="agro-input" style={{ paddingLeft: 14 }} value={unidade} onChange={e => setUnidade(e.target.value)} onFocus={() => setFocusField("unidade")} onBlur={() => setFocusField(null)}>
                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={`field-group${focusField === "preco" ? " focused" : ""}`}>
                    <label className="field-label">Preço por {unidade} (R$) *</label>
                    <div className="input-wrap">
                      <input className="agro-input" type="number" placeholder="Ex: 1.50" value={precoUnitario} onChange={e => setPrecoUnitario(e.target.value)} onFocus={() => setFocusField("preco")} onBlur={() => setFocusField(null)} />
                    </div>
                  </div>
                </div>
                <button className="btn-salvar" onClick={handleCriarInsumo} disabled={loading}>
                  <div className="btn-inner">{loading && <div className="spinner" />}{loading ? "Salvando..." : "Cadastrar"}</div>
                </button>
              </div>
            )}

            <div className="lista-card">
              <div className="lista-header">
                <span className="lista-titulo">Insumos</span>
                <span className="lista-count">{insumos.length} cadastrados</span>
              </div>
              {insumos.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum insumo cadastrado</p>
                  <span>Cadastre ração, silagem e outros</span>
                </div>
              ) : (
                insumos.map(ins => (
                  <div key={ins.id} className="insumo-item">
                    <div className="insumo-info">
                      <div className="insumo-nome">{ins.nome}</div>
                      <div className="insumo-detalhes">
                        <span>{ins.unidade}</span>
                        <span>{formatarMoeda(ins.preco_unitario)} / {ins.unidade}</span>
                      </div>
                    </div>
                    <button className="btn-deletar" onClick={() => handleDeletarInsumo(ins.id)}>Remover</button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ABA CONSUMOS */}
        {aba === "consumos" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <button className="btn-novo" onClick={() => { setMostrarFormConsumo(!mostrarFormConsumo); setErro(""); }}>
                {mostrarFormConsumo ? "Fechar" : "+ Registrar Consumo"}
              </button>
            </div>

            {mostrarFormConsumo && (
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-title">Registrar Consumo</span>
                  <span className="form-badge">Novo</span>
                </div>
                {erro && <div className="erro-box">{erro}</div>}

                <div className="tipo-toggle" style={{ marginBottom: 16 }}>
                  <button className={`tipo-btn${tipoAlvo === "animal" ? " ativo" : ""}`} onClick={() => setTipoAlvo("animal")}>Por Animal</button>
                  <button className={`tipo-btn${tipoAlvo === "lote" ? " ativo" : ""}`} onClick={() => setTipoAlvo("lote")}>Por Lote</button>
                  <button className={`tipo-btn${tipoAlvo === "geral" ? " ativo" : ""}`} onClick={() => setTipoAlvo("geral")}>Geral</button>
                </div>

                <div className="form-row">
                  <div className={`field-group${focusField === "insumo" ? " focused" : ""}`}>
                    <label className="field-label">Insumo *</label>
                    <div className="input-wrap">
                      <select className="agro-input" style={{ paddingLeft: 14 }} value={insumoId} onChange={e => setInsumoId(e.target.value)} onFocus={() => setFocusField("insumo")} onBlur={() => setFocusField(null)}>
                        <option value="">Selecione</option>
                        {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={`field-group${focusField === "qtd" ? " focused" : ""}`}>
                    <label className="field-label">Quantidade/dia *</label>
                    <div className="input-wrap">
                      <input className="agro-input" type="number" placeholder="Ex: 8.5" value={quantidadeDia} onChange={e => setQuantidadeDia(e.target.value)} onFocus={() => setFocusField("qtd")} onBlur={() => setFocusField(null)} />
                    </div>
                  </div>
                  <div className={`field-group${focusField === "inicio" ? " focused" : ""}`}>
                    <label className="field-label">Data Início *</label>
                    <div className="input-wrap">
                      <input className="agro-input" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} onFocus={() => setFocusField("inicio")} onBlur={() => setFocusField(null)} />
                    </div>
                  </div>
                  <div className={`field-group${focusField === "fim" ? " focused" : ""}`}>
                    <label className="field-label">Data Fim</label>
                    <div className="input-wrap">
                      <input className="agro-input" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} onFocus={() => setFocusField("fim")} onBlur={() => setFocusField(null)} />
                    </div>
                  </div>
                  {tipoAlvo === "animal" && (
                    <div className="field-group">
                      <label className="field-label">Animal</label>
                      <div className="input-wrap">
                        <select className="agro-input" style={{ paddingLeft: 14 }} value={animalId} onChange={e => setAnimalId(e.target.value)}>
                          <option value="">Selecione</option>
                          {animais.map(a => <option key={a.id} value={a.id}>#{a.brinco} {a.raca ? `· ${a.raca}` : ""}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {tipoAlvo === "lote" && (
                    <div className="field-group">
                      <label className="field-label">Lote</label>
                      <div className="input-wrap">
                        <select className="agro-input" style={{ paddingLeft: 14 }} value={loteId} onChange={e => setLoteId(e.target.value)}>
                          <option value="">Selecione</option>
                          {lotes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="field-group">
                    <label className="field-label">Observação</label>
                    <div className="input-wrap">
                      <input className="agro-input" placeholder="Observações" value={observacao} onChange={e => setObservacao(e.target.value)} />
                    </div>
                  </div>
                </div>
                <button className="btn-salvar" onClick={handleRegistrarConsumo} disabled={loading}>
                  <div className="btn-inner">{loading && <div className="spinner" />}{loading ? "Salvando..." : "Registrar"}</div>
                </button>
              </div>
            )}

            <div className="lista-card">
              <div className="lista-header">
                <span className="lista-titulo">Registros de Consumo</span>
                <span className="lista-count">{consumos.length} registros</span>
              </div>
              {carregando ? (
                <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
              ) : consumos.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum consumo registrado</p>
                  <span>Registre o consumo de ração e outros insumos</span>
                </div>
              ) : (
                consumos.map((c, idx) => (
                  <div key={c.id} className="consumo-item" style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className="consumo-info">
                      <div className="consumo-nome">{c.insumo_nome}</div>
                      <div className="consumo-detalhes">
                        {c.brinco && <span>#{c.brinco}</span>}
                        {c.lote_nome && <span>{c.lote_nome}</span>}
                        <span>{c.quantidade_dia} {c.unidade}/dia</span>
                        <span>{formatarData(c.data_inicio)} {c.data_fim ? `- ${formatarData(c.data_fim)}` : "- hoje"}</span>
                        <span>{c.dias_total} dias</span>
                      </div>
                      <div className="consumo-custos">
                        <span className="custo-item">Total: <strong>{Number(c.quantidade_total).toFixed(1)} {c.unidade}</strong></span>
                        <span className="custo-item custo-destaque">Custo: <strong>{formatarMoeda(c.custo_total)}</strong></span>
                      </div>
                      {c.observacao && <div className="consumo-obs">{c.observacao}</div>}
                    </div>
                    <button className="btn-deletar" onClick={() => handleDeletarConsumo(c.id)}>Remover</button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Insumos;