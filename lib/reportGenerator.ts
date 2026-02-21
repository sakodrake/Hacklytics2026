export function generateNotebook(trends:any[]){
  const header = `# TrendSpinoff Report\nGenerated: ${new Date().toISOString()}\n\nSummary of top trends:`
  const list = trends.map(t=> `- ${t.title} (${t.views} views)`).join('\n')
  const md = `${header}\n\n${list}`

  const code = `# Auto-generated dataset\nimport pandas as pd\ntrends = ${JSON.stringify(trends, null, 2)}\ndf = pd.DataFrame(trends)\nprint(df.head())\n` 

  const nb = {
    cells: [
      {
        cell_type: 'markdown',
        metadata: { language: 'markdown' },
        source: [md]
      },
      {
        cell_type: 'code',
        metadata: { language: 'python' },
        source: [code],
        outputs: [],
        execution_count: null
      }
    ],
    metadata: {
      kernelspec: { name: 'python3', display_name: 'Python 3' },
      language_info: { name: 'python' }
    },
    nbformat: 4,
    nbformat_minor: 5
  }

  return nb
}
