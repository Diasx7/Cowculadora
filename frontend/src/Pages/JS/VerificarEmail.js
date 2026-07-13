import { useEffect, useState } from "react";
import api from "../../api";
import "../css/VerificarEmail.css";

function VerificarEmail({ setTela, token }) {
  const [status, setStatus] = useState("verificando"); // verificando | sucesso | erro
  const [mensagem, setMensagem] = useState("");
  const [email, setEmail] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [msgReenvio, setMsgReenvio] = useState("");

  useEffect(() => {
    async function confirmar() {
      if (!token) {
        setStatus("erro");
        setMensagem("Link sem token. Verifique se copiou o link inteiro do e-mail.");
        return;
      }
      try {
        const res = await api.get(`/verificar-email?token=${encodeURIComponent(token)}`);
        setStatus("sucesso");
        setMensagem(res.data.message || "E-mail confirmado com sucesso");
      } catch (err) {
        setStatus("erro");
        setMensagem(err.response?.data?.error || "Não foi possível confirmar o e-mail.");
      }
    }
    confirmar();
  }, [token]);

  async function handleReenviar() {
    if (!email) {
      setMsgReenvio("Informe seu e-mail pra gente reenviar o link.");
      return;
    }
    setReenviando(true);
    setMsgReenvio("");
    try {
      const res = await api.post("/reenviar-verificacao", { email });
      setMsgReenvio(res.data.message || "Se o e-mail existir, reenviamos o link.");
    } catch (err) {
      setMsgReenvio("Não foi possível reenviar agora. Tente de novo em instantes.");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="agro-root">
      <div className="verificar-wrapper">
        <div className="login-brand">
          <div className="brand-icon">PM</div>
          <div className="brand-title">PesoMax</div>
          <div className="brand-subtitle">Balança de Confinamento</div>
        </div>

        <div className="verificar-card">
          {status === "verificando" && (
            <>
              <div className="card-heading">
                <h2>Confirmando seu e-mail</h2>
                <p>Só um instante...</p>
              </div>
              <div className="spinner-grande" />
            </>
          )}

          {status === "sucesso" && (
            <>
              <div className="card-heading">
                <h2>E-mail confirmado</h2>
                <p>{mensagem}. Agora é só fazer login.</p>
              </div>
              <button className="btn-login" onClick={() => setTela("login")}>
                <div className="btn-login-inner">Ir para login</div>
              </button>
            </>
          )}

          {status === "erro" && (
            <>
              <div className="card-heading">
                <h2>Link inválido ou expirado</h2>
                <p>{mensagem}</p>
              </div>

              <div className="field-group">
                <label className="field-label">Seu e-mail</label>
                <div className="input-wrap">
                  <input
                    className="agro-input"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={reenviando}
                  />
                </div>
              </div>

              {msgReenvio && <div className="aviso-box">{msgReenvio}</div>}

              <button className="btn-login" onClick={handleReenviar} disabled={reenviando}>
                <div className="btn-login-inner">
                  {reenviando && <div className="spinner" />}
                  {reenviando ? "Reenviando..." : "Reenviar e-mail"}
                </div>
              </button>

              <div className="link-cadastro" onClick={() => setTela("login")}>
                <span>Voltar para o login</span>
              </div>
            </>
          )}
        </div>

        <div className="bottom-badge">© 2025 PesoMax · Todos os direitos reservados</div>
      </div>
    </div>
  );
}

export default VerificarEmail;
