import { useState } from 'react'

export default function ReportPage(){
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function generate(){
    setLoading(true)
    setMessage('')
    try{
      const res = await fetch('/api/report')
      const nb = await res.json()
      const blob = new Blob([JSON.stringify(nb, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'trendspinoff_report.ipynb'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMessage('Report downloaded')
    }catch(e){
      setMessage('Failed to generate report')
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-2">Generate Analytics Report</h2>
        <p className="text-sm text-gray-600 mb-4">Creates a Jupyter notebook (.ipynb) summarizing current feed data.</p>

        <div className="flex gap-3">
          <button onClick={generate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Generating...' : 'Generate Report'}</button>
        </div>

        {message && <div className="mt-4 text-sm text-gray-700">{message}</div>}
      </div>
    </div>
  )
}
