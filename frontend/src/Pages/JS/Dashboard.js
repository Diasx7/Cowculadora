import { useState, useEffect } from "react";
import api from "../../api";
import "../css/Dashboard.css";

function Dashboard({ setTela }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const res = await api.get("/dashboard", { headers });
        setDados(res.data);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  function formatarData(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function formatarDataSimples(data) {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  const totalAnimais = dados?.totalAnimais ?? 0;
  const machos = dados?.distribuicao?.find(d => d.sexo === "Macho")?.total ?? 0;
  const femeas = dados?.distribuicao?.find(d => d.sexo === "Fêmea")?.total ?? 0;
  const totalAlertas = (dados?.semPesar ?? 0) + (dados?.gmdBaixo ?? 0) + (dados?.emCarencia ?? 0);

  return (
    <div className="dashboard-root">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">⚖️</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("perfil")}>← Voltar</button>
      </nav>

      <div className="dashboard-content">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>Visão geral do seu rebanho</p>
        </div>

        {loading ? (
          <>
            <div className="skeleton-block" />
            <div className="skeleton-block" style={{ height: 80 }} />
            <div className="skeleton-block" />
          </>
        ) : (
          <>
            {/* ALERTAS — aparece só se tiver algo */}
            {totalAlertas > 0 && (
              <div className="alertas-card">
                <div className="alertas-header">
                  <span className="alertas-titulo">⚠️ Alertas ({totalAlertas})</span>
                </div>
                <div className="alertas-lista">
                  {dados.semPesar > 0 && (
                    <div className="alerta-item" onClick={() => setTela("animais")} style={{ cursor: "pointer" }}>
                      <span className="alerta-dot vermelho" />
                      <span><strong>{dados.semPesar}</strong> animal(is) sem pesar há mais de 30 dias</span>
                      <span className="alerta-link">Ver →</span>
                    </div>
                  )}
                  {dados.gmdBaixo > 0 && (
                    <div className="alerta-item" onClick={() => setTela("animais")} style={{ cursor: "pointer" }}>
                      <span className="alerta-dot laranja" />
                      <span><strong>{dados.gmdBaixo}</strong> animal(is) com GMD abaixo de 0.5 kg/dia</span>
                      <span className="alerta-link">Ver →</span>
                    </div>
                  )}
                  {dados.emCarencia > 0 && (
                    <div className="alerta-item" onClick={() => setTela("medicamentos")} style={{ cursor: "pointer" }}>
                      <span className="alerta-dot amarelo" />
                      <span><strong>{dados.emCarencia}</strong> animal(is) em carência de medicamento</span>
                      <span className="alerta-link">Ver →</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CARDS PRINCIPAIS */}
            <div className="main-cards">
              <div className="main-card" style={{ cursor: "pointer" }} onClick={() => setTela("animais")}>
                <div className="card-icon">🐄</div>
                <div className="card-value">{dados?.totalAnimais ?? "—"}</div>
                <div className="card-label">Total de animais</div>
                <div className="card-sub">Clique para gerenciar</div>
              </div>
              <div className="main-card" style={{ cursor: "pointer" }} onClick={() => setTela("pesagem")}>
                <div className="card-icon">⚖️</div>
                <div className="card-value">{dados?.totalPesagens ?? "—"}</div>
                <div className="card-label">Total de pesagens</div>
                <div className="card-sub">Clique para registrar</div>
              </div>
              <div className="main-card">
                <div className="card-icon">📊</div>
                <div className="card-value">{dados?.pesoMedio ?? "—"}</div>
                <div className="card-label">Peso médio (kg)</div>
                <div className="card-sub">Média geral do rebanho</div>
              </div>
              <div className="main-card" style={{ cursor: "pointer" }} onClick={() => setTela("medicamentos")}>
                <div className="card-icon">💊</div>
                <div className="card-value" style={{ color: dados?.emCarencia > 0 ? "#e09a28" : "#6daa28" }}>{dados?.emCarencia ?? 0}</div>
                <div className="card-label">Em carência</div>
                <div className="card-sub">{dados?.emCarencia > 0 ? "Atenção necessária" : "Nenhuma carência ativa"}</div>
              </div>
            </div>

            {/* STATS SECUNDÁRIOS */}
            <div className="secondary-cards">
              <div className="secondary-card">
                <div className="secondary-icon">📈</div>
                <div className="secondary-value">{dados?.gmdMedio ?? "—"}</div>
                <div className="secondary-label">GMD médio (kg/dia)</div>
              </div>
              <div className="secondary-card">
                <div className="secondary-icon">♂️</div>
                <div className="secondary-value">{machos}</div>
                <div className="secondary-label">Machos</div>
              </div>
              <div className="secondary-card">
                <div className="secondary-icon">♀️</div>
                <div className="secondary-value">{femeas}</div>
                <div className="secondary-label">Fêmeas</div>
              </div>
            </div>

            {/* ÚLTIMA PESAGEM */}
            {dados?.ultimaPesagem && (
              <div className="ultima-pesagem-card">
                <div className="section-title">Última Pesagem</div>
                <div className="ultima-info">
                  <div className="ultima-animal">
                    <div className="ultima-avatar">🐄</div>
                    <div>
                      <div className="ultima-nome">
                        {dados.ultimaPesagem.brinco ? `#${dados.ultimaPesagem.brinco}` : "Sem identificação"}
                        {dados.ultimaPesagem.raca && ` · ${dados.ultimaPesagem.raca}`}
                      </div>
                      <div className="ultima-data">{formatarData(dados.ultimaPesagem.created_at)}</div>
                    </div>
                  </div>
                  <div className="ultima-peso">
                    <span className="ultima-peso-valor">{dados.ultimaPesagem.peso}</span>
                    <span className="ultima-peso-unit">kg</span>
                  </div>
                </div>
              </div>
            )}

            {/* ÚLTIMOS MEDICAMENTOS */}
            {dados?.ultimosMedicamentos?.length > 0 && (
              <div className="ultima-pesagem-card" style={{ cursor: "pointer" }} onClick={() => setTela("medicamentos")}>
                <div className="section-title">Últimos Medicamentos</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                  {dados.ultimosMedicamentos.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#c8c4bc" }}>💊 {m.nome}</span>
                        <span style={{ fontSize: 12, color: "#4a5640", marginLeft: 8 }}>
                          {m.brinco ? `#${m.brinco}` : m.lote_nome || "—"} · {formatarDataSimples(m.data_aplicacao)}
                        </span>
                      </div>
                      {m.carencia_dias > 0 && m.dias_restantes_carencia > 0 && (
                        <span style={{ fontSize: 11, color: "#e09a28", background: "rgba(224,154,40,0.1)", border: "1px solid rgba(224,154,40,0.25)", borderRadius: 20, padding: "2px 8px" }}>
                          ⏳ {m.dias_restantes_carencia}d restantes
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DISTRIBUIÇÃO */}
            {totalAnimais > 0 && (
              <div className="distribuicao-card">
                <div className="section-title">Distribuição do Rebanho</div>
                <div className="dist-row">
                  {[
                    { label: "Machos", valor: machos, icon: "♂️" },
                    { label: "Fêmeas", valor: femeas, icon: "♀️" },
                    { label: "Não informado", valor: totalAnimais - machos - femeas, icon: "❓" },
                  ].filter(d => d.valor > 0).map((d) => (
                    <div className="dist-item" key={d.label}>
                      <div className="dist-label-row">
                        <span className="dist-label">{d.icon} {d.label}</span>
                        <span className="dist-count">{d.valor} ({Math.round((d.valor / totalAnimais) * 100)}%)</span>
                      </div>
                      <div className="dist-bar-bg">
                        <div className="dist-bar-fill" style={{ width: `${(d.valor / totalAnimais) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;