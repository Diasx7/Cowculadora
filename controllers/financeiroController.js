const db = require("../config/db");
const axios = require("axios");
const cheerio = require("cheerio");

// cache simples da cotação pra não fazer scraping toda hora
// (o CEPEA atualiza 1x por dia, não faz sentido buscar a cada request)
let cotacaoCache = null;
let cacheHora = 0;
const CACHE_TEMPO = 1000 * 60 * 60; // 1 hora

// BUSCAR COTAÇÃO DA ARROBA DO CEPEA
exports.getCotacao = async (req, res) => {
  // se tem cache válido, retorna direto
  if (cotacaoCache && Date.now() - cacheHora < CACHE_TEMPO) {
    return res.json(cotacaoCache);
  }

  try {
    const { data } = await axios.get(
      "https://www.cepea.esalq.usp.br/br/indicador/boi-gordo.aspx",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        timeout: 8000
      }
    );

    const $ = cheerio.load(data);
    let valorArroba = null;
    let dataRef = null;

    // Tenta pegar o valor da tabela do Cepea
    $("table#imagenet-indicador1 tbody tr").first().find("td").each((i, el) => {
      const txt = $(el).text().trim().replace(",", ".");
      if (i === 0) dataRef = txt;
      if (i === 1) valorArroba = parseFloat(txt.replace(/[^\d.]/g, ""));
    });

    if (!valorArroba) {
      // Fallback: tenta outro seletor
      $(".cepea-table-bold").first().each((i, el) => {
        const txt = $(el).text().trim();
        const num = parseFloat(txt.replace(",", ".").replace(/[^\d.]/g, ""));
        if (!isNaN(num) && num > 100) valorArroba = num;
      });
    }

    if (valorArroba) {
      const valorKg = (valorArroba / 15).toFixed(2); // 1 arroba = 15kg
      const resultado = {
        arroba: valorArroba.toFixed(2),
        kg: valorKg,
        data: dataRef || new Date().toLocaleDateString("pt-BR"),
        fonte: "CEPEA/ESALQ"
      };
      // guarda no cache
      cotacaoCache = resultado;
      cacheHora = Date.now();
      res.json(resultado);
    } else {
      // Se não conseguir scraping, retorna null para o frontend usar manual
      res.json({ arroba: null, kg: null, data: null, fonte: null });
    }
  } catch (err) {
    console.error("Erro ao buscar cotação:", err.message);
    // se o scraping falhou mas tem cache velho, melhor cotação de ontem do que nada
    if (cotacaoCache) {
      return res.json(cotacaoCache);
    }
    res.json({ arroba: null, kg: null, data: null, fonte: null });
  }
};

// SALVAR DADOS FINANCEIROS DO ANIMAL
exports.salvarFinanceiro = async (req, res) => {
  const { animalId, valorCompra, dataCompra, pesoCompra } = req.body;
  const userId = req.usuario.id;

  if (!animalId) return res.status(400).json({ error: "Animal é obrigatório" });

  try {
    // Verifica se já existe
    const [existing] = await db.query(
      "SELECT id FROM financeiro WHERE animal_id = ? AND user_id = ?",
      [animalId, userId]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE financeiro SET valor_compra = ?, data_compra = ?, peso_compra = ? WHERE animal_id = ? AND user_id = ?",
        [valorCompra || null, dataCompra || null, pesoCompra || null, animalId, userId]
      );
    } else {
      await db.query(
        "INSERT INTO financeiro (user_id, animal_id, valor_compra, data_compra, peso_compra) VALUES (?, ?, ?, ?, ?)",
        [userId, animalId, valorCompra || null, dataCompra || null, pesoCompra || null]
      );
    }

    res.json({ message: "Dados financeiros salvos" });
  } catch (err) {
    console.error("ERRO financeiro:", err);
    res.status(500).json({ error: "Erro ao salvar dados financeiros" });
  }
};

// LISTAR FINANCEIRO DE TODOS OS ANIMAIS
exports.listarFinanceiro = async (req, res) => {
  const userId = req.usuario.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        a.id, a.brinco, a.raca, a.sexo,
        f.valor_compra, f.data_compra, f.peso_compra,
        (SELECT p.peso FROM pesagens p WHERE p.animal_id = a.id ORDER BY p.created_at DESC LIMIT 1) as peso_atual,
        (SELECT p2.peso FROM pesagens p2 WHERE p2.animal_id = a.id ORDER BY p2.created_at ASC LIMIT 1) as peso_inicial,
        DATEDIFF(
          (SELECT p3.created_at FROM pesagens p3 WHERE p3.animal_id = a.id ORDER BY p3.created_at DESC LIMIT 1),
          (SELECT p4.created_at FROM pesagens p4 WHERE p4.animal_id = a.id ORDER BY p4.created_at ASC LIMIT 1)
        ) as dias_confinamento
       FROM animais a
       LEFT JOIN financeiro f ON f.animal_id = a.id AND f.user_id = a.user_id
       WHERE a.user_id = ?
       ORDER BY a.brinco`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("ERRO listar financeiro:", err);
    res.status(500).json({ error: "Erro ao buscar dados financeiros" });
  }
};
