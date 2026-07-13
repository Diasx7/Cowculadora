import { useState } from "react";
import Login from "./Pages/JS/Login";
import Cadastro from "./Pages/JS/Cadastro";
import Perfil from "./Pages/JS/Perfil";
import Pesagem from "./Pages/JS/Pesagem";
import Animais from "./Pages/JS/Animais";
import HistoricoAnimal from "./Pages/JS/Historicoanimal";
import Dashboard from "./Pages/JS/Dashboard";
import Lotes from "./Pages/JS/Lotes";
import Medicamentos from "./Pages/JS/Medicamentos";
import Financeiro from "./Pages/JS/Financeiro";
import Agenda from "./Pages/JS/Agenda";
import Insumos from "./Pages/JS/Insumos";
import SessaoPesagem from "./Pages/JS/SessaoPesagem";
import VerificarEmail from "./Pages/JS/VerificarEmail";

// se a url veio com ?token=... (link do email), abre direto na tela de verificacao
function telaInicial() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ? "verificarEmail" : "login";
}

function App() {
  const [tela, setTela] = useState(telaInicial);
  const [animalSelecionado, setAnimalSelecionado] = useState(null);
  const [tokenVerificacao] = useState(() => new URLSearchParams(window.location.search).get("token"));

  return (
    <div>
      {tela === "login"         && <Login setTela={setTela} />}
      {tela === "cadastro"      && <Cadastro setTela={setTela} />}
      {tela === "verificarEmail" && <VerificarEmail setTela={setTela} token={tokenVerificacao} />}
      {tela === "perfil"        && <Perfil setTela={setTela} />}
      {tela === "pesagem"       && <Pesagem setTela={setTela} />}
      {tela === "animais"       && <Animais setTela={setTela} setAnimalSelecionado={setAnimalSelecionado} />}
      {tela === "historico"     && <HistoricoAnimal setTela={setTela} animalId={animalSelecionado} />}
      {tela === "dashboard"     && <Dashboard setTela={setTela} />}
      {tela === "lotes"         && <Lotes setTela={setTela} />}
      {tela === "medicamentos"  && <Medicamentos setTela={setTela} />}
      {tela === "financeiro"    && <Financeiro setTela={setTela} />}
      {tela === "agenda"        && <Agenda setTela={setTela} />}
      {tela === "insumos"       && <Insumos setTela={setTela} />}
      {tela === "sessaoPesagem" && <SessaoPesagem setTela={setTela} />}
    </div>
  );
}

export default App;