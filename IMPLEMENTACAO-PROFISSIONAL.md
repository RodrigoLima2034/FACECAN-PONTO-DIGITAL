# PONTO FACIAL ENTERPRISE v3.0.0

## 🚀 Sistema Profissional de Reconhecimento Facial

Sistema empresarial de registro de ponto por reconhecimento facial integrado com **Oracle Database** e **Amazon AWS**, desenvolvido para implementação em terminais tablet em ambientes corporativos.

---

## 📋 Índice

1. [Características](#características)
2. [Requisitos de Sistema](#requisitos-de-sistema)
3. [Instalação](#instalação)
4. [Configuração AWS](#configuração-aws)
5. [Configuração Oracle](#configuração-oracle)
6. [Arquitetura](#arquitetura)
7. [APIs](#apis)
8. [Troubleshooting](#troubleshooting)

---

## ✨ Características

### 🎯 Terminal de Ponto (User-Facing)
- ✅ Reconhecimento facial em tempo real com câmera HD
- ✅ Interface tablet-first responsiva (1024px breakpoint)
- ✅ Design profissional com tema escuro e acentos verdes (#00d084)
- ✅ Feedback visual com animações Framer Motion
- ✅ Overlay SVG de detecção de rosto com guias
- ✅ Estatísticas em tempo real (entrada, saída, tempo trabalhado)
- ✅ Integração seamless AWS Rekognition + Oracle

### 👨‍💼 Dashboard Administrativo
- 📊 Gráficos em tempo real com Recharts
- 📈 Estatísticas de confiança de reconhecimento
- 🔔 Alertas de sistema e status integração
- ⚙️ Configurações avançadas (modo reconhecimento, confiança mínima)
- 📝 Controle de registros e relatórios

### 🔐 Segurança & Compliance
- 🔐 Criptografia AES-256 para fotos em S3
- 📜 Conformidade LGPD (Lei Geral de Proteção de Dados)
- 🛡️ Pool de conexão Oracle com timeout
- 📡 TLS para comunicação AWS
- 🔑 AWS Cognito ready (opcional)

---

## 💻 Requisitos de Sistema

### Frontend (Next.js 14)
- Node.js 18+
- npm ou pnpm
- Navegador com suporte WebRTC (Chrome, Firefox, Edge, Safari)

### Backend
- **Oracle Database 19c+** (ou 21c para melhor performance)
- **AWS Account** com credenciais configuradas
- **Buckets S3** para armazenamento de fotos
- **DynamoDB** para cache de sessões

### Hardware (Tablet/Terminal)
- Processador: ARM 4-core mínimo
- RAM: 4GB mínimo
- Câmera HD integrada (1280x720 mínimo)
- Conexão LAN/WiFi estável

---

## 📦 Instalação

### 1. Clone o Repositório
```bash
git clone <seu-repo>
cd ponto-facial
```

### 2. Instale Dependências
```bash
npm install
# ou
pnpm install
```

### 3. Copie .env.example para .env.local
```bash
cp .env.example .env.local
```

### 4. Configure Variáveis de Ambiente
```env
# ORACLE
ORACLE_USER=ponto_user
ORACLE_PASSWORD=SecurePassword123!
ORACLE_CONNECTION_STRING=oracle-host.aws.com:1521/XE

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=ponto-facial-photos
DYNAMODB_TABLE=ponto-facial-records

# App
NEXT_PUBLIC_API_URL=https://seu-dominio.com
NODE_ENV=production
```

### 5. Execute Migrações do Banco (Opcional)
```bash
npm run db:migrate
```

### 6. Build e Deploy
```bash
npm run build
npm start
```

---

## ☁️ Configuração AWS

### S3 Bucket Configuration
```bash
# 1. Crie um bucket S3
aws s3 mb s3://ponto-facial-photos --region us-east-1

# 2. Configure Server-Side Encryption
aws s3api put-bucket-encryption \
  --bucket ponto-facial-photos \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# 3. Configure CORS (para uploads do navegador)
aws s3api put-bucket-cors \
  --bucket ponto-facial-photos \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["https://seu-dominio.com"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

### DynamoDB Tables
```bash
# Tabela de Cache de Rostos
aws dynamodb create-table \
  --table-name ponto-facial-faces \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Tabela de Registros de Presença
aws dynamodb create-table \
  --table-name ponto-facial-records \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### IAM Policy (Least Privilege)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ponto-facial-photos/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectFaces",
        "rekognition:CompareFaces",
        "rekognition:SearchFacesByImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/ponto-facial-*"
    },
    {
      "Effect": "Allow",
      "Action": "cloudwatch:PutMetricData",
      "Resource": "*"
    }
  ]
}
```

---

## 🗄️ Configuração Oracle

### Schema SQL
```sql
-- Tabela de Funcionários
CREATE TABLE PONTO.EMPLOYEES (
  EMP_ID NUMBER PRIMARY KEY,
  REGISTRATION VARCHAR2(50) UNIQUE NOT NULL,
  NAME VARCHAR2(255) NOT NULL,
  DEPARTMENT VARCHAR2(100),
  SHIFT_NAME VARCHAR2(50),
  PHOTO_URL VARCHAR2(500),
  FACE_TEMPLATE BLOB,
  STATUS VARCHAR2(20) DEFAULT 'ACTIVE',
  CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP,
  UPDATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Tabela de Registros de Presença v2 (Nova)
CREATE TABLE PONTO.ATTENDANCE_RECORDS_V2 (
  ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  EMPLOYEE_ID NUMBER NOT NULL,
  DEVICE_ID VARCHAR2(50),
  SOURCE VARCHAR2(50),
  CONFIDENCE NUMBER(3,2),
  PHOTO_PATH VARCHAR2(500),
  COORDINATES CLOB,
  CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP,
  STATUS VARCHAR2(20) DEFAULT 'PROCESSED',
  FOREIGN KEY (EMPLOYEE_ID) REFERENCES EMPLOYEES(EMP_ID)
);

-- Índices para Performance
CREATE INDEX IDX_ATTENDANCE_EMPLOYEE ON PONTO.ATTENDANCE_RECORDS_V2(EMPLOYEE_ID);
CREATE INDEX IDX_ATTENDANCE_DATE ON PONTO.ATTENDANCE_RECORDS_V2(CREATED_AT);
CREATE INDEX IDX_EMPLOYEES_STATUS ON PONTO.EMPLOYEES(STATUS);
```

### Connection Pool
```typescript
// Automático via lib/oracle.ts
// Pool: min 2, max 10 conexões
// Timeout: 3 segundos
// Auto-reconnect: habilitado
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│         Terminal Tablet (Cliente)                │
│  app/attendance-page.tsx                         │
│  - Câmera HTML5 MediaDevices API                │
│  - Canvas para captura de frames                │
│  - Framer Motion para animações                 │
└──────────────────┬──────────────────────────────┘
                   │ POST /api/attendance/recognize
                   ▼
┌─────────────────────────────────────────────────┐
│      API Next.js (Backend)                       │
│  /api/attendance/recognize                      │
│  - Converte base64 para Buffer                  │
│  - Chama AWS Rekognition DetectFaces            │
│  - Faz upload para S3                           │
│  - Insere em Oracle com pool de conexões        │
│  - Armazena em DynamoDB cache                   │
└──────┬──────────────┬──────────────┬────────────┘
       │              │              │
       ▼              ▼              ▼
   AWS S3       AWS Rekognition   Oracle DB
  (Fotos)       (Face Detection)  (Registros)
       │              │              │
       └──────────────┴──────────────┘
              │
              ▼
    DynamoDB (Cache)
    CloudWatch (Logs)

┌─────────────────────────────────────────────────┐
│    Dashboard Administrativo                      │
│  app/admin/dashboard.tsx                        │
│  - Recharts gráficos real-time                  │
│  - Estatísticas Oracle queries                  │
│  - CloudWatch metrics                           │
└─────────────────────────────────────────────────┘
```

---

## 📡 APIs

### POST `/api/attendance/recognize`

Registra presença via reconhecimento facial.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "device_id": "TABLET-TERMINAL-01",
  "source": "FACE_RECOGNITION"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "✅ João Silva registrado com sucesso",
  "employee": {
    "id": 12345,
    "registration": "2024001",
    "name": "João Silva",
    "department": "TI",
    "shift_name": "Manhã",
    "photo_url": "https://..."
  },
  "record": {
    "id": 98765,
    "event": "ENTRADA",
    "occurred_at": "2024-01-15T08:30:00Z",
    "device_id": "TABLET-TERMINAL-01",
    "confidence": 0.96,
    "photo_url": "s3://ponto-facial-photos/..."
  }
}
```

**Error (400/404/500):**
```json
{
  "message": "❌ Nenhum rosto detectado. Tente novamente."
}
```

---

### GET `/api/attendance/stats`

Retorna estatísticas do dia atual.

**Response:**
```json
{
  "checked_in_today": 45,
  "pending": 12,
  "time_worked": "08:30",
  "avg_confidence": 0.96
}
```

---

### GET `/api/admin/dashboard`

Retorna dados completos do dashboard.

**Response:**
```json
{
  "stats": {
    "total_employees": 150,
    "checked_in_today": 145,
    "late_arrivals": 3,
    "avg_confidence": 0.95,
    "system_uptime": "99.8%",
    "total_records_today": 298,
    "failed_recognitions": 4
  },
  "chartData": [
    {"time": "08:00", "success": 45, "failed": 2},
    {"time": "08:30", "success": 52, "failed": 1}
  ]
}
```

---

## 🛠️ Troubleshooting

### ❌ "Nenhum rosto detectado"
- Verifique iluminação frontal adequada
- Distância recomendada: 40-60cm
- Câmera deve estar limpa
- Limpar cache do navegador

### ❌ "Erro ao acessar câmera"
- Verifique permissões do navegador (https necessário)
- Aceitar quando navegador pedir permissão
- Revisar Configurações > Privacidade > Câmera
- Testar com Chrome/Edge (melhor suporte)

### ❌ Erro de Conexão Oracle
```bash
# Verificar conexão
sqlplus ponto_user/password@oracle-host:1521/XE

# Testar pool
curl http://localhost:3000/api/admin/health
```

### ❌ Timeout AWS S3
```bash
# Verificar bucket access
aws s3 ls s3://ponto-facial-photos

# Verificar credenciais
aws sts get-caller-identity
```

### 🔍 Logs
```bash
# Real-time logs
npm run dev

# Production logs
tail -f /var/log/ponto-facial/app.log

# CloudWatch logs
aws logs tail /aws/lambda/ponto-facial --follow
```

---

## 📊 Performance Tuning

### Oracle Connection Pool
```typescript
poolMax: 10,      // Máximo de conexões
poolMin: 2,       // Mínimo de conexões
poolIncrement: 1, // Incremento por requisição
waitTimeout: 3000 // Timeout em ms
```

### S3 Optimization
- Usar CloudFront para caching de fotos
- Intelligent-Tiering para armazenamento automático
- Lifecycle policies para arquivos antigos

### DynamoDB
- On-demand billing para picos irregulares
- TTL automático para limpeza de cache
- Global Secondary Indexes para queries rápidas

---

## 🚀 Deploy em Produção

### Vercel (Recomendado para Next.js)
```bash
npm install -g vercel
vercel env add ORACLE_USER
vercel env add ORACLE_PASSWORD
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel deploy --prod
```

### AWS EC2 / ECS
```bash
docker build -t ponto-facial:3.0.0 .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag ponto-facial:3.0.0 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ponto-facial:3.0.0
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/ponto-facial:3.0.0
```

---

## 📞 Suporte

- **Email:** support@pontefacial.com
- **Documentação:** https://docs.pontefacial.com
- **GitHub Issues:** https://github.com/seu-repo/issues

---

**Versão:** 3.0.0-Enterprise  
**Última Atualização:** Janeiro 2024  
**Desenvolvido com:** Next.js 14 • React 18 • TypeScript 5 • Framer Motion • AWS SDK • oracledb
