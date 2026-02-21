import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function InsightCharts({velocityData, hashtagData}:{
  velocityData: {labels: string[], values: number[]},
  hashtagData: {labels: string[], values: number[]}
}){
  const lineData = {
    labels: velocityData.labels,
    datasets: [
      {
        label: 'Views per hour (approx)',
        data: velocityData.values,
        borderColor: 'rgba(37,99,235,1)',
        backgroundColor: 'rgba(37,99,235,0.2)'
      }
    ]
  }

  const barData = {
    labels: hashtagData.labels,
    datasets: [
      {
        label: 'Hashtag frequency',
        data: hashtagData.values,
        backgroundColor: 'rgba(16,185,129,0.8)'
      }
    ]
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Trend Velocity</h3>
        <Line data={lineData} />
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Top Hashtags</h3>
        <Bar data={barData} />
      </div>
    </div>
  )
}
