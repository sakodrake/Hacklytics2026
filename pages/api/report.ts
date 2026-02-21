import type { NextApiRequest, NextApiResponse } from 'next'
import { generateNotebook } from '../../lib/reportGenerator'
import { SAMPLE } from './trends'

export default function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'GET') return res.status(405).end()

  const nb = generateNotebook(SAMPLE.trends)
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json(nb)
}
