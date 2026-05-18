import { useEffect, useState } from "react";
import api from "../../api";
import "../css/Pesagem.css";

function Pesagem({ setTela }) {
  const [peso, setPeso] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [animais, setAnimais] = useState([]);
  const [pesagens, setPesagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [focusPeso, setFocusPeso] = useState(false);
  const [focusAnimal, setFocusAnimal] = useState(false);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: "Bearer " + token };

  async function carregarAnimais() {
    try {
      const res = await api.get("/animais", { headers });
      setAnimais(res.data);
    } catch (err) {
      console.error("Erro ao carregar animais:", err);
    }
  }

  async function carregarPesagens() {
    setLoading(true);
    try {
      const res = await api.get("/pesagens", { headers });
      setPesagens(res.data);
    } catch (err) {
      console.error("Erro ao carregar pesagens:", err);
    } finally {
      setLoading(false);
    }
  }

  async function salvarPesagem() {
    setErro("");
    if (!peso) {
      setErro("Informe o peso!");
      return;
    }
    if (!animalId) {
      setErro("Selecione um animal!");
      return;
    }
    setSalvando(true);
    try {
      const animalSelecionado = animais.find((a) => a.id === Number(animalId));
      await api.post(
        "/pesagens",
        { 
          peso, 
          animalId: Number(animalId),
          animal: animalSelecionado ? `#${animalSelecionado.brinco}` : ""
        },
        { headers }
      );
      setPeso("");
      setAnimalId("");
      carregarPesagens();
    } catch (err) {
      setErro("Erro ao salvar pesagem.");
      console.error(err);
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    carregarAnimais();
    carregarPesagens();
  }, []);

  const totalRegistros = pesagens.length;
  const pesoMedio =
    totalRegistros > 0
      ? (pesagens.reduce((acc, p) => acc + Number(p.peso), 0) / totalRegistros).toFixed(1)
      : "—";
  const maiorPeso =
    totalRegistros > 0
      ? Math.max(...pesagens.map((p) => Number(p.peso)))
      : "—";

  return (
    <div className="pesagem-root">
      {/* NAV */}
      <nav className="pesagem-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">⚖️</div>
          <div className="nav-brand-name">PesoMax</div>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>
          ← Voltar
        </button>
      </nav>

      <div className="pesagem-content">
        <div className="page-title">
          <h1>Registro de Pesagem</h1>
          <p>Cadastre e acompanhe o peso do seu rebanho</p>
        </div>

        {/* STATS */}
        <div className="stats-row">
          {[
            { label: "Total de registros", value: totalRegistros, icon: "📋" },
            { label: "Peso médio (kg)",    value: pesoMedio,      icon: "📊" },
            { label: "Maior peso (kg)",    value: maiorPeso,      icon: "🏆" },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* FORM */}
        <div className="form-card">
          <div className="form-card-header">
            <span className="form-card-title">Nova pesagem</span>
            <span className="form-badge">+ Novo</span>
          </div>

          {erro && <div style={{
            background: "rgba(224,82,82,0.08)",
            border: "1px solid rgba(224,82,82,0.3)",
            color: "#e05252",
            borderRadius: "10px",
            padding: "11px 16px",
            marginBottom: "18px",
            fontSize: "13px"
          }}>⚠️ {erro}</div>}

          <div className="form-row">
            <div className={`field-group${focusPeso ? " focused" : ""}`}>
              <label className="field-label">Peso (kg)</label>
              <div className="input-wrap">
                <span className="input-icon">⚖️</span>
                <input
                  className="agro-input"
                  type="number"
                  placeholder="Ex: 420"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  onFocus={() => setFocusPeso(true)}
                  onBlur={() => setFocusPeso(false)}
                />
              </div>
            </div>

            <div className={`field-group${focusAnimal ? " focused" : ""}`}>
              <label className="field-label">Animal</label>
              <div className="input-wrap">
                <span className="input-icon">🐄</span>
                <select
                  className="agro-input"
                  style={{ paddingLeft: "42px", cursor: "pointer" }}
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                  onFocus={() => setFocusAnimal(true)}
                  onBlur={() => setFocusAnimal(false)}
                >
                  <option value="">Selecione um animal</option>
                  {animais.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.brinco} {a.raca ? `· ${a.raca}` : ""} {a.sexo ? `· ${a.sexo}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {animais.length === 0 && (
                <span style={{ fontSize: "11px", color: "#e09a28", marginTop: "5px" }}>
                  ⚠️ Nenhum animal cadastrado. <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setTela("animais")}>Cadastrar agora</span>
                </span>
              )}
            </div>
          </div>

          <button className="btn-salvar" onClick={salvarPesagem} disabled={salvando}>
            <div className="btn-inner">
              {salvando && <div className="spinner" />}
              {salvando ? "Salvando..." : "Salvar pesagem"}
            </div>
          </button>
        </div>

        {/* HISTÓRICO */}
        <div className="historico-card">
          <div className="historico-header">
            <span className="form-card-title">Histórico</span>
            <span className="historico-count">{totalRegistros} registro{totalRegistros !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}
            </div>
          ) : pesagens.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐄</div>
              <p>Nenhuma pesagem registrada ainda.</p>
              <span>Use o formulário acima para começar.</span>
            </div>
          ) : (
            <ul className="pesagem-list">
              {pesagens.map((p, idx) => (
                <li className="pesagem-item" key={p.id}>
                  <div className="pesagem-item-left">
                    <div className="pesagem-rank">#{String(idx + 1).padStart(2, "0")}</div>
                    <div className="pesagem-animal">
                      {p.brinco ? `#${p.brinco}` : p.animal || "Sem identificação"}
                      {p.raca && <span style={{ fontSize: "12px", color: "#4a5640", marginLeft: "6px" }}>· {p.raca}</span>}
                    </div>
                  </div>
                  <div className="pesagem-peso-badge">
                    <span className="peso-valor">{p.peso}</span>
                    <span className="peso-unit">kg</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Pesagem;