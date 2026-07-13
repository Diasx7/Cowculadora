import { useEffect, useRef, useState } from "react";
import api from "../../api";
import "../css/SessaoPesagem.css";

// data de hoje no formato do input type=date, sem passar por UTC (senão vira o dia anterior à noite)
function hojeISO() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// aceita virgula ou ponto como decimal
function paraNumero(str) {
  return parseFloat(String(str).trim().replace(",", "."));
}

function validarPeso(valor) {
  if (isNaN(valor)) return "Digite um peso válido";
  if (valor <= 0) return "O peso precisa ser maior que zero";
  if (valor >= 1500) return "Peso muito alto (máximo 1499 kg)";
  return null;
}

function SessaoPesagem({ setTela }) {
  const [lotes, setLotes] = useState([]);
  const [carregandoLotes, setCarregandoLotes] = useState(true);
  const [loteId, setLoteId] = useState("");
  const [dataSessao, setDataSessao] = useState(hojeISO());
  const [headcountAtual, setHeadcountAtual] = useState(null);
  const [focusField, setFocusField] = useState(null);

  const [pesoInput, setPesoInput] = useState("");
  const [erroInput, setErroInput] = useState("");
  const [pesos, setPesos] = useState([]);
  const proximoId = useRef(1);
  const inputRef = useRef(null);

  const [editandoValorId, setEditandoValorId] = useState(null);
  const [valorEdicao, setValorEdicao] = useState("");
  const [erroEdicao, setErroEdicao] = useState("");

  const [editandoBrincoId, setEditandoBrincoId] = useState(null);
  const [brincoEdicao, setBrincoEdicao] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    buscarLotes();
  }, []);

  useEffect(() => {
    if (!loteId) {
      setHeadcountAtual(null);
      return;
    }
    buscarHeadcount(loteId);
  }, [loteId]);

  async function buscarLotes() {
    setCarregandoLotes(true);
    try {
      const res = await api.get("/lotes");
      setLotes(res.data);
    } catch (err) {
      console.error("Erro ao buscar lotes:", err);
    } finally {
      setCarregandoLotes(false);
    }
  }

  async function buscarHeadcount(id) {
    try {
      const res = await api.get(`/movimentacoes/lote/${id}`);
      setHeadcountAtual(res.data.headcountAtual);
    } catch (err) {
      console.error("Erro ao buscar headcount do lote:", err);
      setHeadcountAtual(null);
    }
  }

  function focarInputPeso() {
    if (inputRef.current) inputRef.current.focus();
  }

  function handleTrocarLote(e) {
    const novoId = e.target.value;
    if (pesos.length > 0) {
      const ok = window.confirm(
        `Trocar de lote apaga os ${pesos.length} pesos já digitados nessa sessão. Continuar?`
      );
      if (!ok) return;
      setPesos([]);
    }
    setLoteId(novoId);
    setErroSalvar("");
    setSucesso("");
  }

  function adicionarPeso() {
    if (!pesoInput.trim()) {
      setErroInput("Digite um peso");
      focarInputPeso();
      return;
    }
    const valor = paraNumero(pesoInput);
    const msg = validarPeso(valor);
    if (msg) {
      setErroInput(msg);
      focarInputPeso();
      return;
    }
    const novo = { id: proximoId.current++, peso: valor, brinco: "" };
    setPesos((prev) => [novo, ...prev]);
    setPesoInput("");
    setErroInput("");
    focarInputPeso();
  }

  // foco volta pro input senão o teclado do celular fecha entre um peso e outro
  function handleKeyDownPeso(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarPeso();
    }
  }

  function abrirEdicaoValor(item) {
    setEditandoBrincoId(null);
    setEditandoValorId(item.id);
    setValorEdicao(String(item.peso));
    setErroEdicao("");
  }

  function salvarEdicaoValor(id) {
    const valor = paraNumero(valorEdicao);
    const msg = validarPeso(valor);
    if (msg) {
      setErroEdicao(msg);
      return;
    }
    setPesos((prev) => prev.map((p) => (p.id === id ? { ...p, peso: valor } : p)));
    setEditandoValorId(null);
  }

  function apagarPeso(id) {
    setPesos((prev) => prev.filter((p) => p.id !== id));
    setEditandoValorId(null);
  }

  function cancelarEdicaoValor() {
    setEditandoValorId(null);
    setErroEdicao("");
  }

  function abrirEdicaoBrinco(item) {
    setEditandoValorId(null);
    setEditandoBrincoId(item.id);
    setBrincoEdicao(item.brinco || "");
  }

  function salvarBrinco(id) {
    setPesos((prev) => prev.map((p) => (p.id === id ? { ...p, brinco: brincoEdicao.trim() } : p)));
    setEditandoBrincoId(null);
  }

  function removerBrinco(id) {
    setPesos((prev) => prev.map((p) => (p.id === id ? { ...p, brinco: "" } : p)));
    setEditandoBrincoId(null);
  }

  function cancelarEdicaoBrinco() {
    setEditandoBrincoId(null);
  }

  async function handleSalvar() {
    setErroSalvar("");
    setSucesso("");
    if (!loteId) {
      setErroSalvar("Selecione um lote.");
      return;
    }
    if (!dataSessao) {
      setErroSalvar("Informe a data da sessão.");
      return;
    }
    if (pesos.length === 0) {
      setErroSalvar("Digite pelo menos um peso antes de salvar.");
      return;
    }

    if (headcountAtual && pesos.length < headcountAtual) {
      const faltam = headcountAtual - pesos.length;
      const ok = window.confirm(
        `Faltam ${faltam} cabeça(s) pra bater o lote (${pesos.length} de ${headcountAtual}). Salvar mesmo assim?`
      );
      if (!ok) return;
    }

    setSalvando(true);
    try {
      // lista tá do mais novo pro mais velho, manda na ordem que foi digitado de verdade
      const pesosNaOrdem = [...pesos].reverse();
      const payload = pesosNaOrdem.map((p) => (p.brinco ? { peso: p.peso, brinco: p.brinco } : p.peso));

      await api.post("/sessoes", { loteId: Number(loteId), dataSessao, pesos: payload });

      setSucesso(`Sessão salva com sucesso! ${pesos.length} pesos registrados.`);
      setPesos([]);
      setPesoInput("");
      setLoteId("");
      setDataSessao(hojeISO());
      setHeadcountAtual(null);
    } catch (err) {
      // nunca descartar a lista em erro - sao 200 pesos digitados na mao
      setErroSalvar(err.response?.data?.error || "Erro ao salvar a sessão.");
    } finally {
      setSalvando(false);
    }
  }

  const totalPesos = pesos.length;
  const mediaParcial = totalPesos > 0 ? pesos.reduce((acc, p) => acc + p.peso, 0) / totalPesos : 0;

  return (
    <div className="sessao-root">
      <nav className="sessao-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">PM</div>
          <div className="nav-brand-name">PesoMax</div>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>Voltar</button>
      </nav>

      <div className="sessao-content">
        <div className="page-title">
          <h1>Pesagem de Lote</h1>
          <p>Digite os pesos na sequência da prancheta. O mais recente fica sempre no topo.</p>
        </div>

        {/* SELEÇÃO DE LOTE E DATA */}
        <div className="form-card">
          <div className="form-card-header">
            <span className="form-card-title">Sessão</span>
            <span className="form-badge">Passo 1</span>
          </div>

          <div className="form-row">
            <div className={`field-group${focusField === "lote" ? " focused" : ""}`}>
              <label className="field-label">Lote</label>
              <div className="input-wrap">
                <select
                  className="agro-input"
                  value={loteId}
                  onChange={handleTrocarLote}
                  onFocus={() => setFocusField("lote")}
                  onBlur={() => setFocusField(null)}
                  disabled={carregandoLotes}
                >
                  <option value="">Selecione um lote</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>{l.nome}</option>
                  ))}
                </select>
              </div>
              {!carregandoLotes && lotes.length === 0 && (
                <span style={{ fontSize: "11px", color: "#e09a28", marginTop: "5px" }}>
                  Nenhum lote cadastrado. <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setTela("lotes")}>Criar agora</span>
                </span>
              )}
              {totalPesos > 0 && (
                <span className="lote-travado-aviso">Trocar o lote agora apaga os pesos já digitados.</span>
              )}
            </div>

            <div className={`field-group${focusField === "data" ? " focused" : ""}`}>
              <label className="field-label">Data da sessão</label>
              <div className="input-wrap">
                <input
                  type="date"
                  className="agro-input"
                  value={dataSessao}
                  onChange={(e) => setDataSessao(e.target.value)}
                  onFocus={() => setFocusField("data")}
                  onBlur={() => setFocusField(null)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CONTADOR - sempre visível, é a info mais importante da tela */}
        <div className="contador-bar">
          <div className="contador-principal">
            <div>
              <div className="contador-value">
                {totalPesos}
                {headcountAtual ? <span className="contador-total"> de {headcountAtual}</span> : null}
              </div>
              <div className="contador-label">Pesos lançados</div>
            </div>
          </div>
          <div className="contador-media">
            <div className="contador-media-value">{totalPesos > 0 ? mediaParcial.toFixed(1) : "—"}</div>
            <div className="contador-media-label">Média (kg)</div>
          </div>
        </div>

        {erroSalvar && <div className="erro-box">{erroSalvar}</div>}
        {sucesso && <div className="sucesso-box">{sucesso}</div>}

        {/* ZONA DE DIGITAÇÃO */}
        <div className="digitacao-card">
          <div className="digitacao-row">
            <input
              ref={inputRef}
              className="input-peso-mega"
              type="text"
              inputMode="decimal"
              placeholder="Peso em kg"
              value={pesoInput}
              onChange={(e) => { setPesoInput(e.target.value); setErroInput(""); }}
              onKeyDown={handleKeyDownPeso}
              disabled={salvando}
              autoFocus
            />
            <button className="btn-adicionar-mega" onClick={adicionarPeso} disabled={salvando}>
              Adicionar
            </button>
          </div>
          <div className="erro-input">{erroInput}</div>
          <div className="dica-digitacao">Digite o peso e aperte Enter. O campo fica pronto pro próximo.</div>
        </div>

        {/* LISTA DE PESOS */}
        <div className="lista-card">
          <div className="lista-header">
            <span className="lista-titulo">Pesos lançados</span>
            <span className="lista-count">{totalPesos} registro{totalPesos !== 1 ? "s" : ""}</span>
          </div>

          {totalPesos === 0 ? (
            <div className="empty-state">
              <p>Nenhum peso lançado ainda.</p>
              <span>Digite o primeiro peso acima para começar a sessão.</span>
            </div>
          ) : (
            <ul className="lista-pesos">
              {pesos.map((p, idx) => {
                const numero = totalPesos - idx;
                const emEdicaoValor = editandoValorId === p.id;
                const emEdicaoBrinco = editandoBrincoId === p.id;
                return (
                  <li className="peso-item" key={p.id}>
                    {emEdicaoValor ? (
                      <div className="peso-edit-row">
                        <input
                          className="agro-input"
                          type="text"
                          inputMode="decimal"
                          value={valorEdicao}
                          onChange={(e) => setValorEdicao(e.target.value)}
                          autoFocus
                        />
                        <button className="btn-mini btn-mini-salvar" onClick={() => salvarEdicaoValor(p.id)}>Salvar</button>
                        <button className="btn-mini btn-mini-apagar" onClick={() => apagarPeso(p.id)}>Apagar</button>
                        <button className="btn-mini btn-mini-cancelar" onClick={cancelarEdicaoValor}>Cancelar</button>
                        {erroEdicao && <div className="erro-input" style={{ width: "100%" }}>{erroEdicao}</div>}
                      </div>
                    ) : emEdicaoBrinco ? (
                      <div className="brinco-edit-row">
                        <input
                          className="agro-input"
                          type="text"
                          placeholder="Número do brinco"
                          value={brincoEdicao}
                          onChange={(e) => setBrincoEdicao(e.target.value)}
                          autoFocus
                        />
                        <button className="btn-mini btn-mini-salvar" onClick={() => salvarBrinco(p.id)}>Salvar</button>
                        {p.brinco && <button className="btn-mini btn-mini-apagar" onClick={() => removerBrinco(p.id)}>Remover</button>}
                        <button className="btn-mini btn-mini-cancelar" onClick={cancelarEdicaoBrinco}>Cancelar</button>
                      </div>
                    ) : (
                      <div className="peso-item-row">
                        <div className="peso-item-main" onClick={() => abrirEdicaoValor(p)}>
                          <span className="peso-rank">#{String(numero).padStart(3, "0")}</span>
                          <span className="peso-valor-grande">{p.peso}<span className="peso-valor-unit">kg</span></span>
                        </div>
                        <div className="peso-item-actions">
                          {p.brinco ? (
                            <button className="brinco-badge" onClick={() => abrirEdicaoBrinco(p)}>Brinco {p.brinco}</button>
                          ) : (
                            <button className="btn-brinco-add" onClick={() => abrirEdicaoBrinco(p)}>Brinco</button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* SALVAR - fixo no rodapé pra sempre estar acessível no celular */}
      <div className="barra-salvar-fixa">
        <div className="barra-salvar-fixa-inner">
          <button className="btn-salvar" onClick={handleSalvar} disabled={salvando}>
            <div className="btn-inner">
              {salvando && <div className="spinner" />}
              {salvando ? "Salvando..." : `Salvar sessão (${totalPesos})`}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessaoPesagem;
