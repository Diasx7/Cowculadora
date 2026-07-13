import { useState, useEffect } from "react";
import api from "../../api";
import "../css/Animais.css";

function Animais({ setTela, setAnimalSelecionado }) {
  const [animais, setAnimais] = useState([]);
  const [brinco, setBrinco] = useState("");
  const [raca, setRaca] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [focusField, setFocusField] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { buscarAnimais(); }, []);

  async function buscarAnimais() {
    setCarregando(true);
    try {
      const res = await api.get("/animais", { headers });
      setAnimais(res.data);
    } catch (err) {
      console.error("Erro ao buscar animais:", err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastrar() {
    setErro(""); setSucesso("");
    if (!brinco) { setErro("O brinco é obrigatório."); return; }
    setLoading(true);
    try {
      await api.post("/animais", { brinco, raca, nascimento, sexo }, { headers });
      setSucesso("Animal cadastrado com sucesso!");
      setBrinco(""); setRaca(""); setNascimento(""); setSexo("");
      setMostrarForm(false);
      buscarAnimais();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao cadastrar animal.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletar(e, id) {
    e.stopPropagation();
    if (!window.confirm("Remover este animal?")) return;
    try {
      await api.delete(`/animais/${id}`, { headers });
      buscarAnimais();
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  }

  function verHistorico(animal) {
    setAnimalSelecionado(animal.id);
    setTela("historico");
  }

  function calcularIdade(nascimento) {
    if (!nascimento) return "—";
    const nasc = new Date(nascimento);
    const hoje = new Date();
    const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
    if (meses < 1) return "< 1 mês";
    if (meses < 12) return `${meses} meses`;
    return `${Math.floor(meses / 12)} ano${Math.floor(meses / 12) > 1 ? "s" : ""}`;
  }

  const machos = animais.filter((a) => a.sexo === "Macho").length;
  const femeas = animais.filter((a) => a.sexo === "Fêmea").length;

  return (
    <div className="animais-root">
      <nav className="animais-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">PM</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>Voltar</button>
      </nav>

      <div className="animais-content">
        <div className="page-title">
          <div className="page-title-text">
            <h1>Animais</h1>
            <p>{animais.length} animal(is) cadastrado(s)</p>
          </div>
          <button className="btn-novo-animal" onClick={() => { setMostrarForm(!mostrarForm); setErro(""); setSucesso(""); }}>
            {mostrarForm ? "Fechar" : "+ Novo Animal"}
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card"><div className="stat-value">{animais.length}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-value">{machos}</div><div className="stat-label">Machos</div></div>
          <div className="stat-card"><div className="stat-value">{femeas}</div><div className="stat-label">Fêmeas</div></div>
        </div>

        {mostrarForm && (
          <div className="form-card">
            <div className="form-card-header">
              <span className="form-card-title">Cadastrar Animal</span>
              <span className="form-badge">Novo</span>
            </div>
            {erro && <div className="erro-box">{erro}</div>}
            <div className="form-row">
              <div className={`field-group${focusField === "brinco" ? " focused" : ""}`}>
                <label className="field-label">Brinco *</label>
                <div className="input-wrap">
                  <input className="agro-input" placeholder="Ex: 001" value={brinco} onChange={(e) => setBrinco(e.target.value)} onFocus={() => setFocusField("brinco")} onBlur={() => setFocusField(null)} disabled={loading} />
                </div>
              </div>
              <div className={`field-group${focusField === "raca" ? " focused" : ""}`}>
                <label className="field-label">Raça</label>
                <div className="input-wrap">
                  <input className="agro-input" placeholder="Ex: Nelore" value={raca} onChange={(e) => setRaca(e.target.value)} onFocus={() => setFocusField("raca")} onBlur={() => setFocusField(null)} disabled={loading} />
                </div>
              </div>
              <div className={`field-group${focusField === "nascimento" ? " focused" : ""}`}>
                <label className="field-label">Data de Nascimento</label>
                <div className="input-wrap">
                  <input className="agro-input" type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} onFocus={() => setFocusField("nascimento")} onBlur={() => setFocusField(null)} disabled={loading} />
                </div>
              </div>
              <div className={`field-group${focusField === "sexo" ? " focused" : ""}`}>
                <label className="field-label">Sexo</label>
                <div className="input-wrap">
                  <select className="agro-input select-input" value={sexo} onChange={(e) => setSexo(e.target.value)} onFocus={() => setFocusField("sexo")} onBlur={() => setFocusField(null)} disabled={loading}>
                    <option value="">Selecione</option>
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="btn-salvar" onClick={handleCadastrar} disabled={loading}>
              <div className="btn-inner">{loading && <div className="spinner" />}{loading ? "Salvando..." : "Salvar Animal"}</div>
            </button>
          </div>
        )}

        {sucesso && !mostrarForm && <div className="sucesso-box">{sucesso}</div>}

        <div className="lista-card">
          <div className="lista-header">
            <span className="lista-titulo">Rebanho</span>
            <span className="lista-count">{animais.length} registros</span>
          </div>
          {carregando ? (
            <div className="skeleton-list">{[1,2,3].map((i) => <div key={i} className="skeleton-row" />)}</div>
          ) : animais.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum animal cadastrado ainda</p>
              <span>Clique em "Novo Animal" para começar</span>
            </div>
          ) : (
            animais.map((animal, index) => (
              <div key={animal.id} className="animal-item" style={{ animationDelay: `${index * 0.05}s`, cursor: "pointer" }} onClick={() => verHistorico(animal)}>
                <div className="animal-item-left">
                  <div className="animal-avatar">{animal.sexo === "Fêmea" ? "F" : "M"}</div>
                  <div className="animal-info">
                    <div className="animal-brinco">#{animal.brinco}</div>
                    <div className="animal-detalhes">
                      <span className="animal-detalhe">{animal.raca || "Raça não informada"}</span>
                      <span className="animal-detalhe">{calcularIdade(animal.nascimento)}</span>
                    </div>
                  </div>
                </div>
                <div className="animal-item-right">
                  {animal.sexo && <span className="sexo-badge">{animal.sexo}</span>}
                  <span style={{ fontSize: "12px", color: "#3a4232" }}>Ver histórico</span>
                  <button className="btn-deletar" onClick={(e) => handleDeletar(e, animal.id)} title="Remover animal">Remover</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Animais;