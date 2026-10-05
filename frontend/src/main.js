import './style.css'
import { BrowserProvider, Contract, isAddress } from 'ethers'

const SEPOLIA_CHAIN_ID = 11155111n
const CONTRACT_ADDRESS = import.meta.env.VITE_CERTITEST_ADDRESS ?? ''
const CERTIFICATE_ABI = [
  'function issuers(address) view returns (bool)',
  'function issueCertificate(address recipient, string metadataURI) returns (uint256)',
  'event CertificateIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string tokenURI)',
]

const icons = {
  mark: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2.5 27 7v8.5c0 7-4.7 11.8-11 14-6.3-2.2-11-7-11-14V7l11-4.5Z" stroke="currentColor" stroke-width="1.7"/><path d="m10.5 15.5 3.6 3.6 7.7-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10h13m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wallet: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12.5" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 7h15m-4 5h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
}

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#inicio" aria-label="CertiTest, inicio">${icons.mark}<span>certitest</span></a>
    <nav aria-label="Navegación principal"><a href="#proceso">El proceso</a><a href="#emitir">Emitir certificado</a></nav>
    <button class="wallet-button" id="connect-wallet" type="button">${icons.wallet}<span>Conectar wallet</span></button>
  </header>

  <main id="inicio">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="status-dot"></span> CERTIFICACIÓN DIGITAL · ETHEREUM</p>
        <h1 id="hero-title">Tus logros,<br><em>para siempre.</em></h1>
        <p class="hero-text">Certificados auténticos, emitidos como NFT y verificables desde cualquier lugar.</p>
        <a class="hero-link" href="#emitir">Certificar un logro ${icons.arrow}</a>
        <p class="slogan">pon certitest en tu vida</p>
      </div>
      <div class="hero-art" aria-label="Vista ilustrativa de un certificado digital">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <article class="certificate-preview">
          <div class="certificate-head"><span>CT / 2025</span><span class="certificate-seal">${icons.mark}</span></div>
          <div class="certificate-rule"></div>
          <p class="certificate-kicker">CERTIFICADO DE LOGRO</p>
          <h2>Aprender<br>abre caminos.</h2>
          <p class="certificate-name">OTORGADO A</p>
          <div class="name-line">Tu nombre aquí</div>
          <div class="certificate-foot"><span>VERIFICADO EN ETHEREUM</span><span>✳</span></div>
        </article>
        <div class="chain-tag"><span class="status-dot"></span> Sepolia testnet</div>
        <span class="art-index">01 — 03</span>
      </div>
    </section>

    <section class="process" id="proceso" aria-label="El proceso de certificación">
      <div class="process-heading"><span>UNA NUEVA FORMA DE ACREDITAR</span><span>01 / 03</span></div>
      <div class="process-steps">
        <article><span class="step-number">01</span><div><h2>Presenta tu logro</h2><p>Nombre, descripción y la imagen que lo representa.</p></div></article>
        <article><span class="step-number">02</span><div><h2>Lo certificamos</h2><p>La agencia verifica y emite un NFT en Ethereum.</p></div></article>
        <article><span class="step-number">03</span><div><h2>Es tuyo. Para siempre.</h2><p>Un registro único, transferible y comprobable.</p></div></article>
      </div>
    </section>

    <section class="issue" id="emitir" aria-labelledby="issue-title">
      <div class="issue-intro"><p class="eyebrow">EMISIÓN DE CERTIFICADO</p><h2 id="issue-title">El siguiente logro<br>es <em>el tuyo.</em></h2><p>Prepara el certificado multimedia. La agencia lo guardará en IPFS y registrará su autenticidad en Sepolia.</p><div class="network-note"><span class="status-dot"></span> Ethereum Sepolia <span class="network-id">CHAIN ID 11155111</span></div></div>
      <form class="issue-form" id="issue-form">
        <label class="field-label" for="recipient">DIRECCIÓN DE QUIEN RECIBE</label>
        <input id="recipient" name="recipient" type="text" placeholder="0x..." autocomplete="off" required pattern="^0x[a-fA-F0-9]{40}$">
        <label class="field-label" for="title">NOMBRE DEL CERTIFICADO</label>
        <input id="title" name="title" type="text" placeholder="p. ej. Fundamentos de Solidity" maxlength="80" required>
        <label class="field-label" for="description">DESCRIPCIÓN <span>OPCIONAL</span></label>
        <textarea id="description" name="description" rows="2" maxlength="280" placeholder="¿Qué acredita este logro?"></textarea>
        <label class="field-label" for="certificate-image">IMAGEN DEL CERTIFICADO <span>PNG, JPG O WEBP · MÁX. 5 MB</span></label>
        <label class="upload-zone" for="certificate-image" id="upload-zone"><input id="certificate-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" required><span class="upload-icon">${icons.upload}</span><span class="upload-title">Elige una imagen o arrástrala aquí</span><span class="upload-meta">La imagen formará parte del NFT multimedia</span><img id="image-preview" alt="Vista previa del certificado" hidden></label>
        <button class="submit-button" type="submit"><span>Emitir certificado NFT</span>${icons.arrow}</button>
        <p class="form-status" id="form-status" aria-live="polite">Conecta la wallet de la agencia para comenzar.</p>
      </form>
    </section>
  </main>

  <footer class="footer"><a class="brand" href="#inicio">${icons.mark}<span>certitest</span></a><span>Certificados con significado. Verificados en Ethereum.</span><span>Sepolia · 11155111</span></footer>
`

const fileInput = document.querySelector('#certificate-image')
const uploadZone = document.querySelector('#upload-zone')
const imagePreview = document.querySelector('#image-preview')
const formStatus = document.querySelector('#form-status')
const walletButton = document.querySelector('#connect-wallet')
const issueButton = document.querySelector('.submit-button')
let signer
let agencyContract
let connectedAddress

function setStatus(message) {
  formStatus.replaceChildren(document.createTextNode(message))
}

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

async function connectWallet() {
  if (!window.ethereum) throw new Error('Instala MetaMask para conectar tu wallet.')

  let provider = new BrowserProvider(window.ethereum)
  await provider.send('eth_requestAccounts', [])
  let network = await provider.getNetwork()
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }])
    } catch {
      throw new Error('Selecciona Ethereum Sepolia en tu wallet y vuelve a conectar.')
    }
    provider = new BrowserProvider(window.ethereum)
    network = await provider.getNetwork()
  }
  if (network.chainId !== SEPOLIA_CHAIN_ID) throw new Error('La wallet no está en Ethereum Sepolia.')

  signer = await provider.getSigner()
  connectedAddress = await signer.getAddress()
  walletButton.querySelector('span').textContent = shortAddress(connectedAddress)
  document.querySelector('#recipient').value = connectedAddress

  if (isAddress(CONTRACT_ADDRESS) && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    agencyContract = new Contract(CONTRACT_ADDRESS, CERTIFICATE_ABI, signer)
    const isIssuer = await agencyContract.issuers(connectedAddress)
    setStatus(isIssuer ? 'Wallet emisora conectada. Lista para emitir en Sepolia.' : 'Wallet conectada, pero no está autorizada como emisora.')
  } else {
    agencyContract = undefined
    setStatus('Wallet conectada a Sepolia. Falta configurar la dirección del contrato.')
  }
}

walletButton.addEventListener('click', async () => {
  walletButton.disabled = true
  try {
    await connectWallet()
  } catch (error) {
    setStatus(error.message || 'No se pudo conectar la wallet.')
  } finally {
    walletButton.disabled = false
  }
})

window.ethereum?.on?.('accountsChanged', () => {
  signer = undefined
  agencyContract = undefined
  connectedAddress = undefined
  walletButton.querySelector('span').textContent = 'Conectar wallet'
  setStatus('Wallet desconectada. Conecta de nuevo para emitir.')
})

document.querySelector('#issue-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  const recipient = document.querySelector('#recipient').value.trim()
  const title = document.querySelector('#title').value.trim()
  const description = document.querySelector('#description').value.trim()
  const file = fileInput.files?.[0]

  if (!signer || !connectedAddress) return setStatus('Conecta primero la wallet de la agencia.')
  if (!agencyContract) return setStatus('Configura VITE_CERTITEST_ADDRESS con el contrato desplegado.')
  if (!isAddress(recipient)) return setStatus('Escribe una dirección Ethereum válida para quien recibe.')
  if (!title || !file) return setStatus('Añade el nombre del certificado y su imagen.')
  if (file.size > 5 * 1024 * 1024) return setStatus('La imagen supera el límite de 5 MB.')

  issueButton.disabled = true
  issueButton.querySelector('span').textContent = 'Guardando certificado…'
  try {
    const imageResponse = await fetch('/api/upload/file', {
      method: 'POST',
      headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
      body: file,
    })
    const imageResult = await imageResponse.json()
    if (!imageResponse.ok) throw new Error(imageResult.error || 'No se pudo guardar la imagen en IPFS.')

    const metadataResponse = await fetch('/api/upload/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title, description, image: imageResult.uri }),
    })
    const metadataResult = await metadataResponse.json()
    if (!metadataResponse.ok) throw new Error(metadataResult.error || 'No se pudieron guardar los metadatos.')

    issueButton.querySelector('span').textContent = 'Confirma la emisión en tu wallet…'
    const transaction = await agencyContract.issueCertificate(recipient, metadataResult.uri)
    setStatus('Transacción enviada. Esperando confirmación de Sepolia…')
    const receipt = await transaction.wait()
    const issuedEvent = receipt.logs.map((log) => {
      try { return agencyContract.interface.parseLog(log) } catch { return undefined }
    }).find((log) => log?.name === 'CertificateIssued')
    const tokenId = issuedEvent?.args.tokenId.toString() ?? 'NFT'
    const transactionLink = document.createElement('a')
    transactionLink.href = `https://sepolia.etherscan.io/tx/${receipt.hash}`
    transactionLink.target = '_blank'
    transactionLink.rel = 'noopener noreferrer'
    transactionLink.textContent = 'Ver en Etherscan'
    formStatus.replaceChildren(document.createTextNode(`Certificado #${tokenId} emitido. `), transactionLink)
    event.target.reset()
    imagePreview.removeAttribute('src')
    imagePreview.hidden = true
    uploadZone.classList.remove('has-image')
    uploadZone.querySelector('.upload-title').textContent = 'Elige una imagen o arrástrala aquí'
  } catch (error) {
    setStatus(error.shortMessage || error.message || 'No se pudo emitir el certificado.')
  } finally {
    issueButton.disabled = false
    issueButton.querySelector('span').textContent = 'Emitir certificado NFT'
  }
})

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    fileInput.value = ''
    formStatus.textContent = 'La imagen supera el límite de 5 MB.'
    return
  }
  imagePreview.src = URL.createObjectURL(file)
  imagePreview.hidden = false
  uploadZone.classList.add('has-image')
  uploadZone.querySelector('.upload-title').textContent = file.name
  formStatus.textContent = 'Imagen lista para el certificado.'
})

for (const eventName of ['dragenter', 'dragover']) {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault()
    uploadZone.classList.add('is-dragging')
  })
}
for (const eventName of ['dragleave', 'drop']) {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault()
    uploadZone.classList.remove('is-dragging')
    if (eventName === 'drop' && event.dataTransfer.files.length) {
      fileInput.files = event.dataTransfer.files
      fileInput.dispatchEvent(new Event('change'))
    }
  })
}
