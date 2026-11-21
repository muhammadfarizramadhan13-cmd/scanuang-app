import { useEffect, useRef, useState } from 'react'
import { Camera, Upload, RotateCcw, Check, ChevronDown, X } from 'lucide-react'

const currencies = [
  { code: 'IDR', name: 'Rupiah Indonesia', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'SGD', name: 'Dolar Singapura', symbol: 'S$', flag: '🇸🇬' },
]

export default function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [currency, setCurrency] = useState(currencies[0])
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
  }, [])

  async function startCamera() {
    setError('')
    setPhoto(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch {
      setError('Kamera tidak dapat diakses. Izinkan akses kamera atau gunakan upload foto.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setPhoto(canvas.toDataURL('image/jpeg', 0.9))
    stopCamera()
  }

  function uploadFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Pilih file gambar yang valid.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      stopCamera()
      setPhoto(reader.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    stopCamera()
    setPhoto(null)
    setAmount('')
    setError('')
  }

  function saveResult() {
    const numericAmount = amount.replace(/[^0-9]/g, '')
    if (!photo) {
      setError('Ambil atau unggah foto uang terlebih dahulu.')
      return
    }
    if (!numericAmount) {
      setError('Masukkan nominal uang secara manual.')
      return
    }
    setHistory(items => [{
      id: Date.now(),
      currency: currency.code,
      amount: numericAmount,
      photo,
    }, ...items].slice(0, 6))
    setError('')
  }

  const formattedAmount = amount
    ? `${currency.symbol} ${Number(amount.replace(/[^0-9]/g, '') || 0).toLocaleString('id-ID')}`
    : 'Belum diisi'

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">M</div><b>Money<span>Scan</span></b></div>
        <div className="status"><i /> Siap dipindai</div>
      </header>

      <section className="workspace">
        <div className="scanner-column">
          <div className="section-heading">
            <div><p>Pemindaian Baru</p><h1>Scan uang Anda</h1></div>
            {(photo || cameraOn) && <button className="icon-button" onClick={reset} title="Mulai ulang"><RotateCcw size={19}/></button>}
          </div>

          <div className="scanner-card">
            {photo ? (
              <div className="preview"><img src={photo} alt="Preview uang"/><div className="captured-badge"><Check size={15}/> Foto tersimpan</div></div>
            ) : cameraOn ? (
              <div className="camera-view"><video ref={videoRef} autoPlay playsInline /><div className="scan-frame"><span/><span/><span/><span/></div></div>
            ) : (
              <div className="camera-placeholder">
                <div className="camera-icon"><Camera size={38}/></div>
                <h2>Arahkan kamera</h2>
                <p>Letakkan uang pada permukaan datar dan pastikan pencahayaan cukup</p>
              </div>
            )}
            <canvas ref={canvasRef} hidden />
          </div>

          {error && <div className="error-message"><X size={16}/>{error}</div>}

          <div className="action-row">
            {cameraOn ? (
              <button className="primary-button" onClick={capture}><Camera size={20}/> Ambil Foto</button>
            ) : (
              <button className="primary-button" onClick={startCamera}><Camera size={20}/> {photo ? 'Scan Ulang' : 'Buka Kamera'}</button>
            )}
            <button className="secondary-button" onClick={() => fileRef.current?.click()}><Upload size={20}/> Upload</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadFile} hidden />
          </div>
        </div>

        <aside className="details-column">
          <div className="details-card">
            <div className="card-title"><span>Detail Mata Uang</span><small>Manual</small></div>

            <label>Mata uang</label>
            <div className="dropdown-wrap">
              <button className="currency-select" onClick={() => setCurrencyOpen(open => !open)}>
                <span className="currency-name"><b>{currency.flag}</b><span><strong>{currency.code}</strong><small>{currency.name}</small></span></span>
                <ChevronDown size={18}/>
              </button>
              {currencyOpen && <div className="currency-menu">{currencies.map(item => (
                <button key={item.code} onClick={() => { setCurrency(item); setCurrencyOpen(false) }}>
                  <span>{item.flag}</span><span><strong>{item.code}</strong><small>{item.name}</small></span>
                  {currency.code === item.code && <Check size={16}/>} 
                </button>
              ))}</div>}
            </div>

            <label htmlFor="amount">Nominal</label>
            <div className="amount-input"><b>{currency.symbol}</b><input id="amount" inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value.replace(/[^0-9]/g, ''))} placeholder="Contoh: 100000" /></div>

            <div className="result-box"><span>Nilai terdeteksi</span><strong>{formattedAmount}</strong><small>{currency.code} — estimasi manual</small></div>

            <button className="save-button" onClick={saveResult}><Check size={19}/> Simpan Hasil</button>
          </div>

          <div className="notice"><b>Informasi penting</b><p>Versi ini tidak memakai AI atau pemeriksaan keaslian. Nominal harus dimasukkan secara manual. Hasil bukan bukti uang asli atau palsu.</p></div>
        </aside>
      </section>

      {history.length > 0 && <section className="history"><div className="section-heading"><div><p>Riwayat</p><h2>Scan terakhir</h2></div></div><div className="history-grid">{history.map(item => (
        <article key={item.id}><img src={item.photo} alt="Hasil scan"/><div><strong>{currencies.find(c => c.code === item.currency)?.symbol} {Number(item.amount).toLocaleString('id-ID')}</strong><small>{item.currency}</small></div></article>
      ))}</div></section>}
    </main>
  )
}
