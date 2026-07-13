import { useState } from "react";
import api from "../../api";
import "../css/Login.css";

function Login({ setTela }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusSenha, setFocusSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [naoVerificado, setNaoVerificado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [msgReenvio, setMsgReenvio] = useState("");

  async function handleLogin() {
    setErro("");
    setNaoVerificado(false);
    setMsgReenvio("");

    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/login", { email, senha });
      localStorage.setItem("token", res.data.token);
      setTela("perfil");
    } catch (err) {
      console.error("Erro no login:", err);
      if (err.response) {
        // 403 com naoVerificado é caso especial - mostra reenviar em vez do erro genérico
        if (err.response.status === 403 && err.response.data?.naoVerificado) {
          setNaoVerificado(true);
        } else {
          // o corpo vem como {error: "..."}, nunca renderiza o objeto direto
          setErro(err.response?.data?.error || "Credenciais inválidas. Tente novamente.");
        }
      } else if (err.request) {
        // requisição saiu mas sem resposta (API fora do ar, CORS, etc.)
        setErro("Não foi possível conectar ao servidor. Verifique se a API está rodando.");
      } else {
        setErro("Erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviar() {
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

  function handleKeyDown(e) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className="agro-root">
      <div className="login-wrapper">

        <div className="login-brand">
          <div className="brand-icon">PM</div>
          <div className="brand-title">PesoMax</div>
          <div className="brand-subtitle">Balança de Confinamento</div>
        </div>

        <div className="login-card">
          <div className="card-heading">
            <h2>Acesse sua conta</h2>
            <p>Gerencie seu rebanho com precisão</p>
          </div>

          {erro && (
            <div className="erro-box">
              {erro}
            </div>
          )}

          {naoVerificado && (
            <div className="aviso-box">
              Confirme seu e-mail para entrar. Não recebeu o link?{" "}
              <span className="link-reenviar" onClick={handleReenviar}>
                {reenviando ? "Reenviando..." : "Reenviar e-mail"}
              </span>
              {msgReenvio && <div style={{ marginTop: 6 }}>{msgReenvio}</div>}
            </div>
          )}

          <div className={`field-group${focusEmail ? " focused" : ""}`}>
            <label className="field-label">E-mail</label>
            <div className="input-wrap">
              <input
                className="agro-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusEmail(true)}
                onBlur={() => setFocusEmail(false)}
                onKeyDown={handleKeyDown}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className={`field-group${focusSenha ? " focused" : ""}`}>
            <label className="field-label">Senha</label>
            <div className="input-wrap">
              <input
                className="agro-input"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onFocus={() => setFocusSenha(true)}
                onBlur={() => setFocusSenha(false)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <button className="btn-login" onClick={handleLogin} disabled={loading}>
            <div className="btn-login-inner">
              {loading && <div className="spinner" />}
              {loading ? "Entrando..." : "Entrar"}
            </div>
          </button>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">ou</span>
            <div className="divider-line" />
          </div>

          <div className="link-cadastro" onClick={() => setTela("cadastro")}>
            Novo por aqui? <span>Criar conta gratuita</span>
          </div>
        </div>

        <div className="bottom-badge">© 2025 PesoMax · Todos os direitos reservados</div>
      </div>
    </div>
  );
}

export default Login;