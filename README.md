# CertiTest

Agencia de certificación digital que emite certificados como NFT multimedia ERC-721 en Ethereum Sepolia. Las imágenes y metadatos se guardan en IPFS; el NFT conserva el CID de los metadatos y la emisión queda verificable en la cadena. Slogan: **pon certitest en tu vida**.

La agencia necesita una wallet con Sepolia ETH para pagar gas y firmar la emisión. La clave privada nunca se introduce en el frontend: solo se usa localmente para desplegar el contrato. La API de almacenamiento usa un JWT de Pinata configurado en el servidor.

---

## Configuración Inicial

1. Copia `.env.example` a `.env` en la raíz del proyecto.
2. Configura `RPC_URL` (RPC de Sepolia), `PRIVATE_KEY` (wallet de despliegue de prueba) y `PINATA_JWT` (JWT del servidor Pinata).
3. Asegúrate de que la wallet de despliegue tenga Sepolia ETH para pagar el gas.
4. Inicializa las dependencias Solidity con `git submodule update --init --recursive`.

---

## Configuración de Redes en Foundry

Foundry usa el alias `sepolia`, definido en `contracts/foundry.toml` y conectado a `RPC_URL`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

[rpc_endpoints]
sepolia = "${RPC_URL}"
```

---

## Uso y Flujo de Trabajo

### Contratos (`contracts/`)

```bash
cd contracts

# Cargar variables locales sin pasar la clave en argumentos del proceso
set -a
source ../.env
set +a

# Compilar, probar y desplegar
forge build
forge test
forge script script/DeployCertiTest.s.sol:DeployCertiTest --rpc-url sepolia --broadcast
```

El deployer queda autorizado como emisor inicial. Para autorizar otra wallet, llama `setIssuer(direccion, true)` desde la cuenta propietaria del contrato. Cada emisión ejecuta una transacción y consume gas de Sepolia.

### Frontend (`frontend/`, puerto 5173)

El contrato ya está desplegado en Sepolia en `0x49bA0f1377B737E32374c6936539434f07Bd025D` (transacción `0x160ac42be91566c39506fe43105f4490d94a1d3b6d2dd08426ac44abdf7d6290`). Copia `frontend/.env.example` a `frontend/.env`; ya incluye esa dirección pública. El servidor API y Vite se ejecutan en terminales separadas:

```bash
# Terminal 1: API de Pinata/IPFS
cd backend
npm start
```

```bash
# Terminal 2: interfaz
cd frontend
cp .env.example .env
# Edita .env y asigna VITE_CERTITEST_ADDRESS
npm run dev -- --host
```

En la interfaz, conecta MetaMask en Sepolia, selecciona una dirección destinataria, completa el nombre y carga una imagen PNG/JPG/WEBP de hasta 5 MB. El backend sube imagen y JSON de metadatos a IPFS; luego la wallet emisora firma el mint. La API no arranca subidas si falta `PINATA_JWT`.

---

## Estructura del Repositorio

```text
.devcontainer/       Contenedor y configuración de Codespaces
backend/             API Node para subir imagen y metadatos a Pinata
contracts/           ERC-721, pruebas y script de despliegue Foundry
frontend/            Vite + JavaScript + Ethers v6
.env.example         RPC_URL, PRIVATE_KEY y PINATA_JWT (solo servidor)
frontend/.env.example VITE_CERTITEST_ADDRESS (dirección pública del contrato)
```

---

## Solución de Problemas

* **Ayuda:** pregunta a Copilot en Codespaces.
* **Error al crear el contenedor:** paleta de comandos (`F1`, `Ctrl+Shift+P` o `Cmd+Shift+P`) → `Codespaces: View Creation Log`.
* **Fondos de prueba (gas):** usa el faucet de la testnet elegida hacia la dirección de tu `PRIVATE_KEY`.
* **Consultar saldo antes de desplegar:**

```bash
cast balance <TU_DIRECCION_PUBLICA> --rpc-url red
```
