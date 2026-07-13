CREATE DATABASE IF NOT EXISTS cowculadora;
USE cowculadora;

-- USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_verificado TINYINT(1) NOT NULL DEFAULT 0,
  token_verificacao VARCHAR(100) DEFAULT NULL,
  token_expira DATETIME DEFAULT NULL
);

-- LOTES
CREATE TABLE IF NOT EXISTS lotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quantidade_inicial INT NOT NULL DEFAULT 0,
  data_entrada DATE
);

-- ANIMAIS
CREATE TABLE IF NOT EXISTS animais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  brinco VARCHAR(50) NOT NULL,
  raca VARCHAR(50),
  nascimento DATE,
  sexo VARCHAR(10),
  lote_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_animal_lote FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL
);

-- PESAGENS
CREATE TABLE IF NOT EXISTS pesagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peso DECIMAL(6,2) NOT NULL,
  animal VARCHAR(100),
  usuario_id INT NOT NULL,
  animal_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pesagem_animal FOREIGN KEY (animal_id) REFERENCES animais(id) ON DELETE SET NULL
);

-- MEDICAMENTOS
CREATE TABLE IF NOT EXISTS medicamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  animal_id INT,
  lote_id INT,
  nome VARCHAR(100) NOT NULL,
  dose VARCHAR(50),
  data_aplicacao DATE NOT NULL,
  carencia_dias INT DEFAULT 0,
  observacao VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  brinco VARCHAR(20)
);

-- FINANCEIRO
CREATE TABLE IF NOT EXISTS financeiro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  animal_id INT NOT NULL,
  valor_compra DECIMAL(10,2),
  data_compra DATE,
  peso_compra DECIMAL(6,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_animal_user (animal_id, user_id)
);

-- AGENDA
CREATE TABLE IF NOT EXISTS agenda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  animal_id INT,
  lote_id INT,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255),
  data_prevista DATE NOT NULL,
  concluido TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSUMOS
CREATE TABLE IF NOT EXISTS insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  unidade VARCHAR(20) NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CONSUMO DE INSUMOS
CREATE TABLE IF NOT EXISTS consumo_insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  insumo_id INT NOT NULL,
  animal_id INT,
  lote_id INT,
  quantidade_dia DECIMAL(10,3) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacao VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SESSOES DE PESAGEM (pivô lote-cêntrico: cada sessão agrupa vários pesos de um lote numa data)
CREATE TABLE IF NOT EXISTS sessoes_pesagem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lote_id INT NOT NULL,
  user_id INT NOT NULL,
  data_sessao DATE NOT NULL,
  observacao VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessao_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
  CONSTRAINT fk_sessao_user FOREIGN KEY (user_id) REFERENCES usuarios(id),
  KEY idx_sessao_lote (lote_id, data_sessao)
);

-- PESOS (pesos individuais e anônimos de uma sessão de pesagem)
CREATE TABLE IF NOT EXISTS pesos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessao_id INT NOT NULL,
  peso DECIMAL(6,2) NOT NULL,
  brinco VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_peso_sessao FOREIGN KEY (sessao_id) REFERENCES sessoes_pesagem(id),
  CONSTRAINT chk_peso_valido CHECK (peso > 0 AND peso < 1500),
  KEY idx_pesos_sessao (sessao_id)
);

-- MOVIMENTACOES DE LOTE (morte, descarte, venda, transferência entre lotes do mesmo usuário)
CREATE TABLE IF NOT EXISTS movimentacoes_lote (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lote_id INT NOT NULL,
  user_id INT NOT NULL,
  tipo ENUM('morte', 'descarte', 'venda', 'transferencia') NOT NULL,
  quantidade INT NOT NULL,
  data_evento DATE NOT NULL,
  lote_destino_id INT,
  peso_medio_estimado DECIMAL(6,2),
  brinco VARCHAR(20),
  observacao VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  causa_morte ENUM('definhamento', 'subita'),
  CONSTRAINT fk_mov_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
  CONSTRAINT fk_mov_user FOREIGN KEY (user_id) REFERENCES usuarios(id),
  CONSTRAINT fk_mov_lote_destino FOREIGN KEY (lote_destino_id) REFERENCES lotes(id),
  CONSTRAINT chk_quantidade_positiva CHECK (quantidade > 0),
  KEY idx_mov_lote_data (lote_id, data_evento)
);