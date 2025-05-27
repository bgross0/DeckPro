import { Layer } from './Layer.js'

export class DeckingLayer extends Layer {
  constructor(options = {}) {
    super('decking', { zIndex: 5, ...options })
    this.footprint = null
    this.visible = true
    this.boardWidth = 5.5 // inches
    this.boardGap = 0.25 // inches
    this.boardColor = '#8B6F47'
    this.gapColor = '#666666'
    this.pattern = 'perpendicular' // or 'diagonal'
  }

  setFootprint(footprint) {
    this.footprint = footprint
    if (this.surface) {
      this.surface.draw()
    }
  }

  setPattern(pattern) {
    this.pattern = pattern
    if (this.surface) {
      this.surface.draw()
    }
  }

  draw(ctx) {
    if (!this.footprint || !this.visible) return

    const surface = this.surface
    const { origin, width_ft, length_ft } = this.footprint

    // Convert to pixels
    const x = surface.feetToPixels(origin.x)
    const y = surface.feetToPixels(origin.y)
    const width = surface.feetToPixels(width_ft)
    const height = surface.feetToPixels(length_ft)

    // Board dimensions in pixels
    const boardWidthPx = surface.feetToPixels(this.boardWidth / 12)
    const boardGapPx = surface.feetToPixels(this.boardGap / 12)
    const totalBoardSpacing = boardWidthPx + boardGapPx

    ctx.save()

    // Clip to deck footprint
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()

    if (this.pattern === 'perpendicular') {
      // Draw boards perpendicular to joists
      ctx.fillStyle = this.boardColor
      
      // Boards run horizontally
      for (let boardY = y; boardY < y + height; boardY += totalBoardSpacing) {
        ctx.fillRect(x, boardY, width, boardWidthPx)
        
        // Draw wood grain texture
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(x, boardY + boardWidthPx / 3)
        ctx.lineTo(x + width, boardY + boardWidthPx / 3)
        ctx.moveTo(x, boardY + boardWidthPx * 2 / 3)
        ctx.lineTo(x + width, boardY + boardWidthPx * 2 / 3)
        ctx.stroke()
      }

      // Draw board ends
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 1
      for (let boardY = y; boardY < y + height; boardY += totalBoardSpacing) {
        // Random board lengths for realism
        const numSegments = Math.floor(width / surface.feetToPixels(8)) + 1
        for (let i = 1; i < numSegments; i++) {
          const segmentX = x + (width / numSegments) * i + (Math.random() - 0.5) * boardWidthPx
          ctx.beginPath()
          ctx.moveTo(segmentX, boardY)
          ctx.lineTo(segmentX, boardY + boardWidthPx)
          ctx.stroke()
        }
      }
    } else if (this.pattern === 'diagonal') {
      // Draw diagonal boards at 45 degrees
      ctx.fillStyle = this.boardColor
      ctx.save()
      ctx.translate(x + width / 2, y + height / 2)
      ctx.rotate(Math.PI / 4)
      
      const diagonal = Math.sqrt(width * width + height * height)
      const startOffset = -diagonal / 2
      
      for (let boardPos = startOffset; boardPos < diagonal / 2; boardPos += totalBoardSpacing) {
        ctx.fillRect(-diagonal / 2, boardPos, diagonal, boardWidthPx)
      }
      
      ctx.restore()
    }

    ctx.restore()
  }
}