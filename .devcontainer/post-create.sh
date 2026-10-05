#!/usr/bin/env bash
set -euo pipefail

export FOUNDRY_DIR="$HOME/.foundry"
curl -L https://foundry.paradigm.xyz | bash
export PATH="$FOUNDRY_DIR/bin:$PATH"
"$FOUNDRY_DIR/bin/foundryup"
echo 'export PATH="$HOME/.foundry/bin:$PATH"' >> ~/.bashrc

git submodule update --init --recursive
if [ ! -d contracts/lib/forge-std/src ]; then
	(cd contracts && forge install foundry-rs/forge-std --no-commit)
fi

[ -d contracts ] || forge init contracts --no-git
[ -d frontend ]  || { npm create -y vite@latest frontend -- --template vanilla --no-interactive && (cd frontend && npm i && npm i ethers@^6); }

cat > contracts/foundry.toml <<'TOML'
[profile.default]
src = "src"
out = "out"
libs = ["lib"]

[rpc_endpoints]
red = "${RPC_URL}"
sepolia = "${RPC_URL}"
TOML

forge --version; cast --version; anvil --version
(cd contracts && forge test)
