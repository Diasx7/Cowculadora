import { useState, useEffect } from "react";
import api from "../../api";
import "../css/Financeiro.css";

function Financeiro({ setTela }) {
  const [animais, setAnimais] = useState([]);
  const [cotacao, setCotacao] = useState(null);
  const [cotacaoManual, setCotacaoManual] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoCotacao, setCarregandoCotacao] = useState(true);
  const [animalEditando, setAnimalEditando] = useState(null);
  const [valorCompra, setValorCompra] = useState("");
  const [dataCompra, setDataCompra] = useState("");
  const [pesoCompra, setPesoCompra] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [diasProjecao, setDiasProjecao] = useState(30);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    buscarDados();
    buscarCotacao();
  }, []);

  async function buscarDados() {
    setCarregando(true);
    try {
      const res = await api.get("/financeiro", { headers });
      setAnimais(res.data);
    } catch (err) {
      console.error("Erro ao buscar financeiro:", err);
    } finally {
      setCarregando(false);
    }
  }

  async function buscarCotacao() {
    setCarregandoCotacao(true);
    try {
      const res = await api.get("/financeiro/cotacao", { headers });
      if (res.data.arroba) {
        setCotacao(res.data);
        setCotacaoManual(res.data.arroba);
      }
    } catch (err) {
      console.error("Erro ao buscar cotação:", err);
    } finally {
      setCarregandoCotacao(false);
    }
  }

  async function salvarFinanceiro(animalId) {
    setSalvando(true);
    try {
      await api.post("/financeiro", { animalId, valorCompra, dataCompra, pesoCompra }, { headers });
      setAnimalEditando(null);
      setValorCompra(""); setDataCompra(""); setPesoCompra("");
      buscarDados();
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(animal) {
    setAnimalEditando(animal.id);
    setValorCompra(animal.valor_compra || "");
    setDataCompra(animal.data_compra ? animal.data_compra.split("T")[0] : "");
    setPesoCompra(animal.peso_compra || "");
  }

  function calcularGMD(animal) {
    if (!animal.peso_atual || !animal.peso_inicial || !animal.dias_confinamento || animal.dias_confinamento <= 0) return null;
    return ((Number(animal.peso_atual) - Number(animal.peso_inicial)) / animal.dias_confinamento).toFixed(3);
  }

  function calcularProjecao(animal, dias) {
    const gmd = calcularGMD(animal);
    if (!gmd || !animal.peso_atual) return null;
    return (Number(animal.peso_atual) + Number(gmd) * dias).toFixed(1);
  }

  function calcularValorAtual(pesoAtual) {
    const arroba = Number(cotacaoManual);
    if (!pesoAtual || !arroba) return null;
    const arrobas = Number(pesoAtual) / 15;
    return (arrobas * arroba).toFixed(2);
  }

  function calcularLucro(animal) {
    const valorAtual = calcularValorAtual(animal.peso_atual);
    if (!valorAtual || !animal.valor_compra) return null;
    return (Number(valorAtual) - Number(animal.valor_compra)).toFixed(2);
  }

  function calcularValorProjecao(animal, dias) {
    const pesoProj = calcularProjecao(animal, dias);
    if (!pesoProj) return null;
    return calcularValorAtual(pesoProj);
  }

  function formatarMoeda(val) {
    if (!val) return "—";
    return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const totalValorRebanho = animais.reduce((acc, a) => {
    const v = calcularValorAtual(a.peso_atual);
    return acc + (v ? Number(v) : 0);
  }, 0);

  const totalLucro = animais.reduce((acc, a) => {
    const l = calcularLucro(a);
    return acc + (l ? Number(l) : 0);
  }, 0);

  return (
    <div className="fin-root">
      <nav className="fin-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">⚖️</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>← Voltar</button>
      </nav>

      <div className="fin-content">
        <div className="page-title">
          <div className="page-title-text">
            <h1>Financeiro</h1>
            <p>Valor do rebanho e projeções</p>
          </div>
        </div>

        {/* COTAÇÃO */}
        <div className="cotacao-card">
          <div className="cotacao-header">
            <div>
              <div className="cotacao-titulo">💹 Cotação da Arroba</div>
              {cotacao?.fonte && (
                <div className="cotacao-fonte">Fonte: {cotacao.fonte} · {cotacao.data}</div>
              )}
            </div>
            <button className="btn-atualizar" onClick={buscarCotacao} disabled={carregandoCotacao}>
              {carregandoCotacao ? "Buscando..." : "🔄 Atualizar"}
            </button>
          </div>

          <div className="cotacao-valores">
            <div className="cotacao-item">
              <div className="cotacao-label">Arroba (R$/@)</div>
              <div className="cotacao-valor">{carregandoCotacao ? "..." : cotacao?.arroba ? `R$ ${cotacao.arroba}` : "—"}</div>
            </div>
            <div className="cotacao-item">
              <div className="cotacao-label">Kg (R$/kg)</div>
              <div className="cotacao-valor">{carregandoCotacao ? "..." : cotacao?.kg ? `R$ ${cotacao.kg}` : "—"}</div>
            </div>
            <div className="cotacao-item editavel">
              <div className="cotacao-label">Usar valor (R$/@)</div>
              <input
                className="cotacao-input"
                type="number"
                placeholder="Ex: 320.00"
                value={cotacaoManual}
                onChange={e => setCotacaoManual(e.target.value)}
              />
            </div>
            <div className="cotacao-item">
              <div className="cotacao-label">Projeção (dias)</div>
              <input
                className="cotacao-input"
                type="number"
                min="1"
                max="365"
                value={diasProjecao}
                onChange={e => setDiasProjecao(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* RESUMO */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🐄</div>
            <div className="stat-value">{animais.length}</div>
            <div className="stat-label">Animais</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value-small">{formatarMoeda(totalValorRebanho)}</div>
            <div className="stat-label">Valor do rebanho</div>
          </div>
          <div className={`stat-card${totalLucro >= 0 ? "" : " negativo"}`}>
            <div className="stat-icon">{totalLucro >= 0 ? "📈" : "📉"}</div>
            <div className="stat-value-small" style={{ color: totalLucro >= 0 ? "#6daa28" : "#e05252" }}>
              {totalLucro >= 0 ? "+" : ""}{formatarMoeda(totalLucro)}
            </div>
            <div className="stat-label">Lucro/Prejuízo total</div>
          </div>
        </div>

        {/* LISTA DE ANIMAIS */}
        <div className="lista-card">
          <div className="lista-header">
            <span className="lista-titulo">Animais</span>
            <span className="lista-count">{animais.length} registros</span>
          </div>

          {carregando ? (
            <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : animais.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <p>Nenhum animal cadastrado</p>
            </div>
          ) : (
            animais.map((animal) => {
              const gmd = calcularGMD(animal);
              const valorAtual = calcularValorAtual(animal.peso_atual);
              const lucro = calcularLucro(animal);
              const pesoProj = calcularProjecao(animal, diasProjecao);
              const valorProj = calcularValorProjecao(animal, diasProjecao);
              const editando = animalEditando === animal.id;

              return (
                <div key={animal.id} className="animal-fin-card">
                  <div className="animal-fin-header">
                    <div className="animal-fin-id">
                      <span className="animal-avatar">{animal.sexo === "Fêmea" ? "🐄" : "🐂"}</span>
                      <div>
                        <div className="animal-brinco">#{animal.brinco}</div>
                        <div className="animal-raca">{animal.raca || "Raça não informada"}</div>
                      </div>
                    </div>
                    <button className="btn-editar" onClick={() => editando ? setAnimalEditando(null) : abrirEdicao(animal)}>
                      {editando ? "✕ Fechar" : "✏️ Editar"}
                    </button>
                  </div>

                  {/* FORM DE EDIÇÃO */}
                  {editando && (
                    <div className="animal-fin-form">
                      <div className="fin-form-row">
                        <div className="fin-field">
                          <label>Valor de compra (R$)</label>
                          <input className="fin-input" type="number" placeholder="Ex: 3500.00" value={valorCompra} onChange={e => setValorCompra(e.target.value)} />
                        </div>
                        <div className="fin-field">
                          <label>Peso na compra (kg)</label>
                          <input className="fin-input" type="number" placeholder="Ex: 280" value={pesoCompra} onChange={e => setPesoCompra(e.target.value)} />
                        </div>
                        <div className="fin-field">
                          <label>Data de compra</label>
                          <input className="fin-input" type="date" value={dataCompra} onChange={e => setDataCompra(e.target.value)} />
                        </div>
                      </div>
                      <button className="btn-salvar-fin" onClick={() => salvarFinanceiro(animal.id)} disabled={salvando}>
                        {salvando ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  )}

                  {/* DADOS FINANCEIROS */}
                  <div className="fin-grid">
                    <div className="fin-item">
                      <div className="fin-item-label">Peso atual</div>
                      <div className="fin-item-value">{animal.peso_atual ? `${animal.peso_atual} kg` : "—"}</div>
                    </div>
                    <div className="fin-item">
                      <div className="fin-item-label">GMD</div>
                      <div className="fin-item-value" style={{ color: gmd > 0 ? "#6daa28" : "#e05252" }}>{gmd ? `${gmd} kg/dia` : "—"}</div>
                    </div>
                    <div className="fin-item">
                      <div className="fin-item-label">Valor compra</div>
                      <div className="fin-item-value">{formatarMoeda(animal.valor_compra)}</div>
                    </div>
                    <div className="fin-item">
                      <div className="fin-item-label">Valor atual</div>
                      <div className="fin-item-value" style={{ color: "#6daa28" }}>{formatarMoeda(valorAtual)}</div>
                    </div>
                    <div className="fin-item">
                      <div className="fin-item-label">Lucro/Prejuízo</div>
                      <div className="fin-item-value" style={{ color: lucro >= 0 ? "#6daa28" : "#e05252" }}>
                        {lucro !== null ? `${lucro >= 0 ? "+" : ""}${formatarMoeda(lucro)}` : "—"}
                      </div>
                    </div>
                    <div className="fin-item destaque">
                      <div className="fin-item-label">Projeção {diasProjecao}d · Peso</div>
                      <div className="fin-item-value">{pesoProj ? `${pesoProj} kg` : "—"}</div>
                    </div>
                    <div className="fin-item destaque">
                      <div className="fin-item-label">Projeção {diasProjecao}d · Valor</div>
                      <div className="fin-item-value" style={{ color: "#6daa28" }}>{formatarMoeda(valorProj)}</div>
                    </div>
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

export default Financeiro;