import { useState } from "react";
import api from "../../api";
import "../css/Cadastro.css";

function Cadastro({ setTela }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleCadastro() {
    setErro("");

    if (!nome || !email || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/usuarios", { nome, email, senha });
      // mostra o toast e so troca de tela depois - sem travar com alert nativo
      setSucesso(true);
      setTimeout(() => setTela("login"), 2000);
    } catch (err) {
      console.error("Erro no cadastro:", err);
      if (err.response) {
        setErro(err.response.data || "Erro ao cadastrar. Tente novamente.");
      } else if (err.request) {
        setErro("Não foi possível conectar ao servidor. Verifique se a API está rodando.");
      } else {
        setErro("Erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  const senhaStrength =
    senha.length === 0 ? 0 : senha.length < 4 ? 1 : senha.length < 7 ? 2 : 3;

  const fields = [
    { id: "nome",  label: "Nome completo", type: "text",     placeholder: "João da Silva",       value: nome,  setter: setNome,  autoComplete: "name" },
    { id: "email", label: "E-mail",        type: "email",    placeholder: "seu@email.com",        value: email, setter: setEmail, autoComplete: "email" },
    { id: "senha", label: "Senha",         type: "password", placeholder: "Mínimo 6 caracteres", value: senha, setter: setSenha, autoComplete: "new-password" },
  ];

  return (
    <div className="agro-root">
      {sucesso && (
        <div className="toast-sucesso">
          <span className="toast-dot" />
          Cadastro realizado com sucesso
        </div>
      )}
      <div className="cad-wrapper">

        <div className="login-brand">
          <div className="brand-icon">PM</div>
          <div className="brand-title">PesoMax</div>
          <div className="brand-subtitle">Balança de Confinamento</div>
        </div>

        <div className="cad-card">
          <div className="steps-bar">
            {[nome, email, senha].map((v, i) => (
              <div key={i} className={`step-dot${v ? " active" : ""}`} />
            ))}
          </div>

          <div className="card-heading">
            <h2>Criar conta</h2>
            <p>Cadastre-se e comece a pesar com precisão</p>
          </div>

          {erro && (
            <div className="erro-box">
              {erro}
            </div>
          )}

          {fields.map((f) => (
            <div key={f.id} className={`field-group${focusField === f.id ? " focused" : ""}`}>
              <label className="field-label">{f.label}</label>
              <div className="input-wrap">
                <input
                  className="agro-input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={f.value}
                  autoComplete={f.autoComplete}
                  onChange={(e) => f.setter(e.target.value)}
                  onFocus={() => setFocusField(f.id)}
                  onBlur={() => setFocusField(null)}
                  disabled={loading}
                />
              </div>
              {f.id === "senha" && senha.length > 0 && (
                <>
                  <div className="senha-strength">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`strength-bar${senhaStrength >= level ? ` s${senhaStrength}` : ""}`}
                      />
                    ))}
                  </div>
                  <div className={`strength-label s${senhaStrength}`}>
                    {senhaStrength === 1 ? "Senha fraca" : senhaStrength === 2 ? "Senha média" : "Senha forte"}
                  </div>
                </>
              )}
            </div>
          ))}

          <button className="btn-cad" onClick={handleCadastro} disabled={loading}>
            <div className="btn-inner">
              {loading && <div className="spinner" />}
              {loading ? "Cadastrando..." : "Criar conta"}
            </div>
          </button>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">ou</span>
            <div className="divider-line" />
          </div>

          <div className="link-voltar" onClick={() => setTela("login")}>
            Já tem conta? <span>Fazer login</span>
          </div>
        </div>

        <div className="bottom-badge">© 2025 PesoMax · Todos os direitos reservados</div>
      </div>
    </div>
  );
}

export default Cadastro;