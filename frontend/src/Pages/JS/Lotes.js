import { useState, useEffect } from "react";
import api from "../../api";
import "../css/Lotes.css";

function Lotes({ setTela }) {
  const [lotes, setLotes] = useState([]);
  const [animaisSemLote, setAnimaisSemLote] = useState([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loteExpandido, setLoteExpandido] = useState(null);
  const [animaisDoLote, setAnimaisDoLote] = useState({});
  const [focusField, setFocusField] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    buscarLotes();
    buscarAnimaisSemLote();
  }, []);

  async function buscarLotes() {
    setCarregando(true);
    try {
      const res = await api.get("/lotes", { headers });
      setLotes(res.data);
    } catch (err) {
      console.error("Erro ao buscar lotes:", err);
    } finally {
      setCarregando(false);
    }
  }

  async function buscarAnimaisSemLote() {
    try {
      const res = await api.get("/animais", { headers });
      setAnimaisSemLote(res.data.filter(a => !a.lote_id));
    } catch (err) {
      console.error("Erro ao buscar animais:", err);
    }
  }

  async function expandirLote(loteId) {
    if (loteExpandido === loteId) {
      setLoteExpandido(null);
      return;
    }
    setLoteExpandido(loteId);
    if (!animaisDoLote[loteId]) {
      try {
        const res = await api.get(`/lotes/${loteId}/animais`, { headers });
        setAnimaisDoLote(prev => ({ ...prev, [loteId]: res.data }));
      } catch (err) {
        console.error("Erro ao buscar animais do lote:", err);
      }
    }
  }

  async function handleCriar() {
    setErro(""); setSucesso("");
    if (!nome) { setErro("O nome é obrigatório."); return; }
    setLoading(true);
    try {
      await api.post("/lotes", { nome, descricao }, { headers });
      setSucesso("Lote criado com sucesso!");
      setNome(""); setDescricao("");
      setMostrarForm(false);
      buscarLotes();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao criar lote.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletar(e, id) {
    e.stopPropagation();
    if (!window.confirm("Remover este lote? Os animais não serão deletados.")) return;
    try {
      await api.delete(`/lotes/${id}`, { headers });
      buscarLotes();
      buscarAnimaisSemLote();
    } catch (err) {
      console.error("Erro ao deletar lote:", err);
    }
  }

  async function moverAnimal(animalId, loteId) {
    try {
      await api.post("/lotes/atribuir", { animalId, loteId }, { headers });
      // recarrega tudo
      buscarLotes();
      buscarAnimaisSemLote();
      setAnimaisDoLote({});
      if (loteExpandido) {
        const res = await api.get(`/lotes/${loteExpandido}/animais`, { headers });
        setAnimaisDoLote(prev => ({ ...prev, [loteExpandido]: res.data }));
      }
    } catch (err) {
      console.error("Erro ao mover animal:", err);
    }
  }

  return (
    <div className="lotes-root">
      <nav className="lotes-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">PM</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>Voltar</button>
      </nav>

      <div className="lotes-content">
        <div className="page-title">
          <div className="page-title-text">
            <h1>Lotes</h1>
            <p>{lotes.length} lote(s) cadastrado(s)</p>
          </div>
          <button className="btn-novo-lote" onClick={() => { setMostrarForm(!mostrarForm); setErro(""); setSucesso(""); }}>
            {mostrarForm ? "Fechar" : "+ Novo Lote"}
          </button>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{lotes.length}</div>
            <div className="stat-label">Total de lotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{lotes.reduce((acc, l) => acc + Number(l.total_animais), 0)}</div>
            <div className="stat-label">Animais em lotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{animaisSemLote.length}</div>
            <div className="stat-label">Sem lote</div>
          </div>
        </div>

        {/* FORM */}
        {mostrarForm && (
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-title">Criar Lote</span>
              <span className="form-badge">Novo</span>
            </div>
            {erro && <div className="erro-box">{erro}</div>}
            <div className="form-row">
              <div className={`field-group${focusField === "nome" ? " focused" : ""}`}>
                <label className="field-label">Nome *</label>
                <div className="input-wrap">
                  <input className="agro-input" placeholder="Ex: Confinamento A" value={nome} onChange={(e) => setNome(e.target.value)} onFocus={() => setFocusField("nome")} onBlur={() => setFocusField(null)} disabled={loading} />
                </div>
              </div>
              <div className={`field-group${focusField === "descricao" ? " focused" : ""}`}>
                <label className="field-label">Descrição</label>
                <div className="input-wrap">
                  <input className="agro-input" placeholder="Ex: Pasto norte, engorda" value={descricao} onChange={(e) => setDescricao(e.target.value)} onFocus={() => setFocusField("descricao")} onBlur={() => setFocusField(null)} disabled={loading} />
                </div>
              </div>
            </div>
            <button className="btn-salvar" onClick={handleCriar} disabled={loading}>
              <div className="btn-inner">{loading && <div className="spinner" />}{loading ? "Salvando..." : "Criar Lote"}</div>
            </button>
          </div>
        )}

        {sucesso && !mostrarForm && <div className="sucesso-box">{sucesso}</div>}

        {/* LISTA DE LOTES */}
        <div className="lista-card">
          <div className="lista-header">
            <span className="lista-titulo">Lotes</span>
            <span className="lista-count">{lotes.length} registros</span>
          </div>

          {carregando ? (
            <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : lotes.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum lote criado ainda</p>
              <span>Clique em "+ Novo Lote" para começar</span>
            </div>
          ) : (
            lotes.map((lote) => (
              <div key={lote.id}>
                <div className="lote-item" onClick={() => expandirLote(lote.id)}>
                  <div className="lote-item-left">
                    <div>
                      <div className="lote-nome">{lote.nome}</div>
                      <div className="lote-desc">{lote.descricao || "Sem descrição"} · {lote.total_animais} animal(is)</div>
                    </div>
                  </div>
                  <div className="lote-item-right">
                    <span className="lote-chevron">{loteExpandido === lote.id ? "▲" : "▼"}</span>
                    <button className="btn-deletar" onClick={(e) => handleDeletar(e, lote.id)}>Remover</button>
                  </div>
                </div>

                {/* ANIMAIS DO LOTE */}
                {loteExpandido === lote.id && (
                  <div className="lote-animais">
                    {(animaisDoLote[lote.id] || []).length === 0 ? (
                      <div className="lote-vazio">Nenhum animal neste lote</div>
                    ) : (
                      (animaisDoLote[lote.id] || []).map(animal => (
                        <div key={animal.id} className="lote-animal-item">
                          <span>#{animal.brinco} {animal.raca ? `· ${animal.raca}` : ""}</span>
                          <button className="btn-remover-lote" onClick={() => moverAnimal(animal.id, null)}>Remover do lote</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ANIMAIS SEM LOTE */}
        {animaisSemLote.length > 0 && (
          <div className="lista-card" style={{ marginTop: 20 }}>
            <div className="lista-header">
              <span className="lista-titulo">Animais sem lote</span>
              <span className="lista-count">{animaisSemLote.length} animais</span>
            </div>
            {animaisSemLote.map(animal => (
              <div key={animal.id} className="lote-animal-item" style={{ padding: "14px 28px" }}>
                <span>#{animal.brinco} {animal.raca ? `· ${animal.raca}` : ""}</span>
                <select
                  className="select-lote"
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) moverAnimal(animal.id, Number(e.target.value)); }}
                >
                  <option value="">Atribuir a lote...</option>
                  {lotes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lotes;