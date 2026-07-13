import { useState, useEffect, useRef } from "react";
import api from "../../api";
import "../css/HistoricoAnimal.css";
import { Chart, LineElement, LineController, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from "chart.js";

Chart.register(LineElement, LineController, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

function HistoricoAnimal({ setTela, animalId }) {
  const [animal, setAnimal] = useState(null);
  const [pesagens, setPesagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: "Bearer " + token };

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const [resAnimal, resPesagens] = await Promise.all([
          api.get(`/animais/${animalId}`, { headers }),
          api.get(`/pesagens/animal/${animalId}`, { headers }),
        ]);
        setAnimal(resAnimal.data);
        setPesagens(resPesagens.data);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [animalId]);

  // monta o gráfico quando pesagens carregarem
  useEffect(() => {
    if (pesagens.length < 2 || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // ordena do mais antigo ao mais recente para o gráfico
    const ordenadas = [...pesagens].reverse();
    const labels = ordenadas.map((p) => new Date(p.created_at).toLocaleDateString("pt-BR"));
    const pesos = ordenadas.map((p) => Number(p.peso));

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Peso (kg)",
          data: pesos,
          borderColor: "#6daa28",
          backgroundColor: "rgba(109,170,40,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: "#6daa28",
          pointBorderColor: "#0d0f0a",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(18,22,14,0.95)",
            borderColor: "rgba(109,170,40,0.3)",
            borderWidth: 1,
            titleColor: "#6daa28",
            bodyColor: "#c8c4bc",
            padding: 12,
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} kg`,
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { color: "#4a5640", font: { size: 11 } },
            border: { color: "rgba(255,255,255,0.06)" }
          },
          y: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "#4a5640", font: { size: 11 },
              callback: (v) => `${v} kg`
            },
            border: { color: "rgba(255,255,255,0.06)" }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [pesagens]);

  function calcularGMD(pesagens) {
    if (pesagens.length < 2) return null;
    const mais_recente = pesagens[0];
    const mais_antigo = pesagens[pesagens.length - 1];
    const diasDiff = Math.max(1, Math.round(
      (new Date(mais_recente.created_at) - new Date(mais_antigo.created_at)) / (1000 * 60 * 60 * 24)
    ));
    return ((Number(mais_recente.peso) - Number(mais_antigo.peso)) / diasDiff).toFixed(3);
  }

  function calcularGMDEntreDois(p1, p2) {
    const dias = Math.max(1, Math.round(
      (new Date(p1.created_at) - new Date(p2.created_at)) / (1000 * 60 * 60 * 24)
    ));
    return ((Number(p1.peso) - Number(p2.peso)) / dias).toFixed(3);
  }

  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-BR");
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

  const gmdGeral = calcularGMD(pesagens);
  const pesoAtual = pesagens.length > 0 ? pesagens[0].peso : null;
  const pesoInicial = pesagens.length > 0 ? pesagens[pesagens.length - 1].peso : null;
  const ganhoTotal = pesoAtual && pesoInicial ? (Number(pesoAtual) - Number(pesoInicial)).toFixed(1) : null;

  return (
    <div className="historico-root">
      <nav className="historico-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">PM</div>
          <span className="nav-brand-name">PesoMax</span>
        </div>
        <button className="btn-voltar" onClick={() => setTela("animais")}>Voltar</button>
      </nav>

      <div className="historico-content">
        {loading ? (
          <div className="skeleton-list">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-row" />)}
          </div>
        ) : (
          <>
            {/* ANIMAL INFO */}
            {animal && (
              <div className="animal-info-card">
                <div className="animal-header">
                  <div className="animal-avatar-big">{animal.sexo === "Fêmea" ? "F" : "M"}</div>
                  <div>
                    <div className="animal-brinco-big">#{animal.brinco}</div>
                    <div className="animal-tags">
                      {animal.raca && <span className="tag">{animal.raca}</span>}
                      {animal.sexo && <span className="tag">{animal.sexo}</span>}
                      {animal.nascimento && <span className="tag">{calcularIdade(animal.nascimento)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STATS */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{pesoAtual ?? "—"}</div>
                <div className="stat-label">Peso atual (kg)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: gmdGeral > 0 ? "#6daa28" : "#e05252" }}>
                  {gmdGeral ?? "—"}
                </div>
                <div className="stat-label">GMD (kg/dia)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: ganhoTotal > 0 ? "#6daa28" : "#e05252" }}>
                  {ganhoTotal !== null ? (ganhoTotal > 0 ? `+${ganhoTotal}` : ganhoTotal) : "—"}
                </div>
                <div className="stat-label">Ganho total (kg)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{pesagens.length}</div>
                <div className="stat-label">Pesagens</div>
              </div>
            </div>

            {/* GRÁFICO */}
            {pesagens.length >= 2 && (
              <div className="grafico-card">
                <div className="grafico-header">
                  <span className="lista-titulo">Evolução do Peso</span>
                  <span className="lista-count">{pesagens.length} pontos</span>
                </div>
                <div className="grafico-wrap">
                  <canvas ref={chartRef} />
                </div>
              </div>
            )}

            {/* HISTÓRICO */}
            <div className="lista-card">
              <div className="lista-header">
                <span className="lista-titulo">Histórico de Pesagens</span>
                <span className="lista-count">{pesagens.length} registros</span>
              </div>

              {pesagens.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma pesagem registrada</p>
                  <span>Registre a primeira pesagem deste animal</span>
                </div>
              ) : (
                <ul className="pesagem-list">
                  {pesagens.map((p, idx) => {
                    const proxima = pesagens[idx + 1];
                    const gmd = proxima ? calcularGMDEntreDois(p, proxima) : null;
                    const ganho = proxima ? (Number(p.peso) - Number(proxima.peso)).toFixed(1) : null;

                    return (
                      <li className="pesagem-item" key={p.id}>
                        <div className="pesagem-item-left">
                          <div className="pesagem-rank">#{String(idx + 1).padStart(2, "0")}</div>
                          <div>
                            <div className="pesagem-data">{formatarData(p.created_at)}</div>
                            {gmd !== null && (
                              <div className={`pesagem-gmd ${Number(gmd) >= 0 ? "positivo" : "negativo"}`}>
                                GMD: {Number(gmd) > 0 ? "+" : ""}{gmd} kg/dia
                                {ganho !== null && ` · ${Number(ganho) > 0 ? "+" : ""}${ganho} kg`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="pesagem-peso-badge">
                          <span className="peso-valor">{p.peso}</span>
                          <span className="peso-unit">kg</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HistoricoAnimal;