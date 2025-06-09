import jsPDF from 'jspdf'

// Tipos para o gerador de PDF
interface ArtigoPDF {
  id: number
  numero: number
  numeroTexto: string
  texto: string
  marcado: boolean
  cor: string | null
  nomeFromLei: string
}

interface LeiPDF {
  nome: string
  artigos: ArtigoPDF[]
}

interface EstatisticasCores {
  [cor: string]: {
    quantidade: number
    porcentagem: number
    descricao: string
  }
}

interface ConfigPDF {
  titulo: string
  concurso: string
  autor?: string
  codigo?: string
  empresa?: string
  edicao?: string
  ano?: string
  avisos?: string
  comentarios?: string
  tituloTransicao?: string
  subtituloTransicao?: string
  legendaCores: Record<string, string>
}

// Configurações de layout corrigido
const LAYOUT = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: {
    top: 15,
    bottom: 15,
    left: 10,
    right: 10
  },
  column: {
    width: 92, // Largura aumentada de cada coluna
    gap: 6 // Espaço entre colunas
  },
  fonts: {
    title: 16,
    subtitle: 14,
    heading: 11,
    subheading: 10,
    body: 8,
    small: 7,
    tiny: 6
  },
  spacing: {
    lineHeight: 3.5, // Espaçamento entre linhas
    articleSpacing: 8, // Espaço entre artigos
    paragraphSpacing: 2 // Espaço entre parágrafos
  },
  colors: {
    primary: [41, 98, 255] as const,
    secondary: [99, 102, 241] as const,
    text: [30, 30, 30] as const,
    muted: [100, 116, 139] as const,
    light: [248, 250, 252] as const,
    border: [226, 232, 240] as const,
    // Cores para marcações - atualizadas
    verde: [34, 197, 94] as const,
    azul: [59, 130, 246] as const,
    amarelo: [255, 193, 7] as const,
    laranja: [255, 87, 34] as const,
    roxo: [156, 39, 176] as const,
    cinza: [96, 125, 139] as const
  }
}

export class VademecumPDFGenerator {
  private doc: jsPDF
  private currentY = 0
  private currentColumn: 'left' | 'right' = 'left'
  private currentPage = 1
  private totalPages = 0
  private sumario: Array<{title: string, page: number}> = []

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
  }

  public async gerarPDF(leis: LeiPDF[], config: ConfigPDF): Promise<void> {
    // 1. Gerar capa moderna
    this.gerarCapa(config)

    // 2. Gerar página de estatísticas/charts
    this.gerarPaginaEstatisticas(leis, config.legendaCores)

    // 3. Gerar página de informações adicionais (avisos e comentários)
    if (config.avisos || config.comentarios) {
      this.gerarPaginaInformacoes(config)
    }

    // 4. Gerar contracapa com legenda
    this.gerarContracapa(config.legendaCores)

    // 5. Gerar sumário
    this.gerarSumario(leis)

    // 6. Adicionar página em branco antes do conteúdo para evitar problemas de layout
    this.adicionarPaginaTransicao(config)

    // 7. Gerar conteúdo principal com todos os artigos
    this.gerarConteudoCompleto(leis)

    // 7. Adicionar numeração de páginas
    this.adicionarNumeracaoPaginas()

    // 8. Configurar metadados
    this.configurarMetadados(config)

    // 9. Salvar arquivo
    const nomeArquivo = `${config.titulo.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
    this.doc.save(nomeArquivo)
  }

  private gerarCapa(config: ConfigPDF): void {
    const { pageWidth, pageHeight } = LAYOUT

    // Background clean e moderno - apenas branco
    this.doc.setFillColor(255, 255, 255)
    this.doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Linha superior moderna
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(0, 0, pageWidth, 3, 'F')

    // Título principal - usar título configurado
    this.doc.setTextColor(...LAYOUT.colors.text)
    this.doc.setFontSize(22)
    this.doc.setFont('helvetica', 'bold')
    this.centralizarTexto(config.titulo.toUpperCase(), 70)

    // Linha decorativa minimalista
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(pageWidth/2 - 40, 80, 80, 1, 'F')

    // Concurso (se fornecido)
    if (config.concurso) {
      this.doc.setTextColor(...LAYOUT.colors.primary)
      this.doc.setFontSize(16)
      this.doc.setFont('helvetica', 'normal')
      this.centralizarTexto(config.concurso, 100)
    }

    // Subtítulo clean
    this.doc.setTextColor(...LAYOUT.colors.muted)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.centralizarTexto('Compilação Jurídica com Marcação Inteligente', 120)

    // Informações do autor e empresa (se fornecidas)
    let yPos = 140
    if (config.autor) {
      this.doc.setTextColor(...LAYOUT.colors.text)
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.centralizarTexto(`Autor: ${config.autor}`, yPos)
      yPos += 15
    }

    if (config.empresa) {
      this.doc.setTextColor(...LAYOUT.colors.muted)
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.centralizarTexto(config.empresa, yPos)
      yPos += 15
    }

    // Edição e Ano
    if (config.edicao || config.ano) {
      this.doc.setTextColor(...LAYOUT.colors.muted)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      const edicaoAno = `${config.edicao || ''} ${config.ano || ''}`.trim()
      this.centralizarTexto(edicaoAno, yPos)
      yPos += 15
    }

    // Código/ISBN (se fornecido)
    if (config.codigo) {
      this.doc.setTextColor(...LAYOUT.colors.muted)
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')
      this.centralizarTexto(`Código: ${config.codigo}`, yPos)
      yPos += 15
    }

    // Data de geração
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
    this.doc.setTextColor(...LAYOUT.colors.muted)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.centralizarTexto(`Gerado em ${dataAtual}`, pageHeight - 60)

    // Avisos importantes (se fornecidos)
    if (config.avisos) {
      this.doc.setFillColor(255, 248, 220) // Fundo amarelo claro para avisos
      this.doc.rect(LAYOUT.margin.left, pageHeight - 50, pageWidth - 2 * LAYOUT.margin.left, 15, 'F')

      this.doc.setTextColor(180, 83, 9) // Texto laranja para avisos
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('⚠️ AVISO IMPORTANTE:', LAYOUT.margin.left + 2, pageHeight - 42)

      this.doc.setFont('helvetica', 'normal')
      const avisosLinhas = this.doc.splitTextToSize(config.avisos, pageWidth - 2 * LAYOUT.margin.left - 4)
      this.doc.text(avisosLinhas.slice(0, 2), LAYOUT.margin.left + 2, pageHeight - 38) // Máximo 2 linhas na capa
    }

    // Rodapé profissional
    this.doc.setFillColor(...LAYOUT.colors.light)
    this.doc.rect(0, pageHeight - 25, pageWidth, 25, 'F')

    this.doc.setTextColor(...LAYOUT.colors.muted)
    this.doc.setFontSize(8)
    this.doc.text('IA Team © 2024', LAYOUT.margin.left, pageHeight - 10)
    this.doc.text('Vade Mecum Estatístico v2.0', pageWidth - LAYOUT.margin.right - 45, pageHeight - 10)

    // Linha decorativa no rodapé
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(0, pageHeight - 25, pageWidth, 1, 'F')
  }

  private gerarPaginaEstatisticas(leis: LeiPDF[], legendaCores: Record<string, string>): void {
    this.doc.addPage()
    this.currentPage++

    // Calcular estatísticas
    const totalArtigos = leis.reduce((sum, lei) => sum + lei.artigos.length, 0)
    const artigosMarcados = leis.reduce((sum, lei) => sum + lei.artigos.filter(a => a.marcado).length, 0)

    // Estatísticas por cor
    const estatisticasCores: EstatisticasCores = {}
    const cores = ['verde', 'azul', 'amarelo', 'laranja', 'roxo', 'cinza']

    for (const cor of cores) {
      const quantidade = leis.reduce((sum, lei) =>
        sum + lei.artigos.filter(a => a.marcado && a.cor === cor).length, 0)
      estatisticasCores[cor] = {
        quantidade,
        porcentagem: artigosMarcados > 0 ? (quantidade / artigosMarcados) * 100 : 0,
        descricao: legendaCores[cor] || cor
      }
    }

    // Título da página
    this.doc.setTextColor(...LAYOUT.colors.text)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.centralizarTexto('ESTATÍSTICAS DE MARCAÇÃO', 40)

    // Linha decorativa
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(LAYOUT.pageWidth/2 - 50, 50, 100, 1, 'F')

    // Cards de estatísticas gerais - layout otimizado
    let y = 70
    const cardWidth = 70
    const cardHeight = 50
    const spacing = 25

    // Card Total de Artigos
    this.doc.setFillColor(...LAYOUT.colors.light)
    this.doc.roundedRect(30, y, cardWidth, cardHeight, 5, 5, 'F')
    this.doc.setTextColor(...LAYOUT.colors.text)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(totalArtigos.toString(), 50, y + 20)
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Total de Artigos', 35, y + 35)

    // Card Artigos Marcados
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.roundedRect(30 + cardWidth + spacing, y, cardWidth, cardHeight, 5, 5, 'F')
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(artigosMarcados.toString(), 50 + cardWidth + spacing, y + 20)
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Marcados', 45 + cardWidth + spacing, y + 35)

    // Gráfico de barras por categoria - melhorado
    y = 140
    this.doc.setTextColor(...LAYOUT.colors.text)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DISTRIBUIÇÃO POR CATEGORIA', 30, y)

    y += 20
    const barMaxWidth = 100
    const barHeight = 12

    for (const [cor, stats] of Object.entries(estatisticasCores)) {
      if (stats.quantidade > 0) {
        const corRGB = LAYOUT.colors[cor as keyof typeof LAYOUT.colors]
        if (corRGB) {
          // Fundo da barra (cinza claro)
          this.doc.setFillColor(240, 240, 240)
          this.doc.rect(25, y, barMaxWidth, barHeight, 'F')

          // Barra colorida proporcional
          const barWidth = Math.max(8, (stats.quantidade / artigosMarcados) * barMaxWidth)
          this.doc.setFillColor(corRGB[0], corRGB[1], corRGB[2])
          this.doc.rect(25, y, barWidth, barHeight, 'F')

          // Borda da barra
          this.doc.setDrawColor(200, 200, 200)
          this.doc.setLineWidth(0.5)
          this.doc.rect(25, y, barMaxWidth, barHeight)

          // Label da categoria
          this.doc.setTextColor(...LAYOUT.colors.text)
          this.doc.setFontSize(7)
          this.doc.setFont('helvetica', 'bold')
          this.doc.text(`${stats.descricao}`, 27, y + 5)

          // Quantidade e porcentagem dentro da barra (se couber) ou do lado
          this.doc.setFontSize(6)
          this.doc.setFont('helvetica', 'normal')
          const statsText = `${stats.quantidade} (${stats.porcentagem.toFixed(1)}%)`

          if (barWidth > 50) {
            // Texto dentro da barra (branco)
            this.doc.setTextColor(255, 255, 255)
            this.doc.text(statsText, 27, y + 12)
          } else {
            // Texto fora da barra (preto)
            this.doc.setTextColor(...LAYOUT.colors.text)
            this.doc.text(statsText, barMaxWidth + 35, y + 10)
          }

          // Círculo colorido como indicador adicional
          this.doc.setFillColor(corRGB[0], corRGB[1], corRGB[2])
          this.doc.circle(20, y + 8, 3, 'F')

          y += 16
        }
      }
    }


  }

  private gerarPaginaInformacoes(config: ConfigPDF): void {
    this.doc.addPage()
    this.currentPage++

    // Header da página de informações
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(0, 0, LAYOUT.pageWidth, 35, 'F')

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(LAYOUT.fonts.title)
    this.doc.setFont('helvetica', 'bold')
    this.centralizarTexto('INFORMAÇÕES IMPORTANTES', 25)

    let y = 60

    // Seção de Avisos
    if (config.avisos) {
      this.doc.setFillColor(255, 245, 245) // Fundo vermelho muito claro
      this.doc.roundedRect(LAYOUT.margin.left, y - 5, LAYOUT.pageWidth - 2 * LAYOUT.margin.left, 8, 2, 2, 'F')

      this.doc.setTextColor(220, 38, 38) // Vermelho para avisos
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('⚠️ AVISOS IMPORTANTES', LAYOUT.margin.left + 5, y + 2)

      y += 15

      this.doc.setTextColor(...LAYOUT.colors.text)
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')

      const avisosLinhas = this.doc.splitTextToSize(config.avisos, LAYOUT.pageWidth - 2 * LAYOUT.margin.left - 10)
      for (const linha of avisosLinhas) {
        if (y > LAYOUT.pageHeight - 40) {
          this.doc.addPage()
          this.currentPage++
          y = 40
        }
        this.doc.text(linha, LAYOUT.margin.left + 5, y)
        y += 4
      }

      y += 20
    }

    // Seção de Comentários
    if (config.comentarios) {
      this.doc.setFillColor(240, 249, 255) // Fundo azul muito claro
      this.doc.roundedRect(LAYOUT.margin.left, y - 5, LAYOUT.pageWidth - 2 * LAYOUT.margin.left, 8, 2, 2, 'F')

      this.doc.setTextColor(...LAYOUT.colors.primary)
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('💬 COMENTÁRIOS E OBSERVAÇÕES', LAYOUT.margin.left + 5, y + 2)

      y += 15

      this.doc.setTextColor(...LAYOUT.colors.text)
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')

      const comentariosLinhas = this.doc.splitTextToSize(config.comentarios, LAYOUT.pageWidth - 2 * LAYOUT.margin.left - 10)
      for (const linha of comentariosLinhas) {
        if (y > LAYOUT.pageHeight - 40) {
          this.doc.addPage()
          this.currentPage++
          y = 40
        }
        this.doc.text(linha, LAYOUT.margin.left + 5, y)
        y += 4
      }
    }

    // Informações técnicas adicionais
    y = Math.max(y + 30, LAYOUT.pageHeight - 80)

    this.doc.setFillColor(...LAYOUT.colors.light)
    this.doc.roundedRect(LAYOUT.margin.left, y, LAYOUT.pageWidth - 2 * LAYOUT.margin.left, 50, 5, 5, 'F')

    this.doc.setTextColor(...LAYOUT.colors.muted)
    this.doc.setFontSize(LAYOUT.fonts.small)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('📋 INFORMAÇÕES TÉCNICAS', LAYOUT.margin.left + 5, y + 12)

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(LAYOUT.fonts.tiny)

    const infoTecnica = [
      `• Título: ${config.titulo}`,
      `• Autor: ${config.autor || 'Não especificado'}`,
      `• Empresa/Editora: ${config.empresa || 'Não especificada'}`,
      `• Edição: ${config.edicao || 'Não especificada'}`,
      `• Ano: ${config.ano || new Date().getFullYear()}`,
      `• Código: ${config.codigo || 'Não especificado'}`,
      "• Sistema: Vademecum Editor v2.0 - IA Team",
      `• Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`
    ]

    let yInfo = y + 20
    for (const info of infoTecnica) {
      this.doc.text(info, LAYOUT.margin.left + 10, yInfo)
      yInfo += 3.5
    }
  }

  private gerarContracapa(legendaCores: Record<string, string>): void {
    this.doc.addPage()
    this.currentPage++

    // Header da contracapa
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(0, 0, LAYOUT.pageWidth, 35, 'F')

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(LAYOUT.fonts.title)
    this.doc.setFont('helvetica', 'bold')
    this.centralizarTexto('SISTEMA DE CORES', 25)

    let y = 60

    // Grid de cores melhorado
    const cores = ['verde', 'azul', 'amarelo', 'laranja', 'roxo', 'cinza']
    for (const cor of cores) {
      const corRGB = LAYOUT.colors[cor as keyof typeof LAYOUT.colors]

      // Container para cada cor
      this.doc.setFillColor(...LAYOUT.colors.light)
      this.doc.roundedRect(LAYOUT.margin.left, y - 8, LAYOUT.pageWidth - 2 * LAYOUT.margin.left, 20, 3, 3, 'F')

      // Círculo colorido único (design clean)
      this.doc.setFillColor(corRGB[0], corRGB[1], corRGB[2])
      this.doc.circle(LAYOUT.margin.left + 15, y, 5, 'F')

      // Nome da cor em destaque
      this.doc.setTextColor(...LAYOUT.colors.text)
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(cor.toUpperCase(), LAYOUT.margin.left + 30, y - 2)

      // Descrição da cor
      this.doc.setFontSize(7)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(legendaCores[cor], LAYOUT.margin.left + 30, y + 6)

      y += 20
    }

    // Seção de instruções compacta
    y += 15
    this.doc.setFillColor(...LAYOUT.colors.secondary)
    this.doc.rect(0, y, LAYOUT.pageWidth, 20, 'F')

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.centralizarTexto('COMO USAR ESTE VADEMECUM', y + 13)

    y += 30
    this.doc.setTextColor(...LAYOUT.colors.text)
    this.doc.setFontSize(7)
    this.doc.setFont('helvetica', 'normal')

    const instrucoes = [
      '✓ Os artigos estão organizados por lei de origem',
      '✓ Cada cor representa um tipo de importância específica',
      '✓ Use o sumário para navegação rápida entre leis',
      '✓ Layout em duas colunas para máximo aproveitamento',
      '✓ Artigos marcados possuem fundo colorido e círculo identificador'
    ]

    for (const instrucao of instrucoes) {
      this.doc.text(instrucao, LAYOUT.margin.left + 5, y)
      y += 10
    }

    // Rodapé da contracapa
    y = LAYOUT.pageHeight - 40
    this.doc.setFillColor(...LAYOUT.colors.light)
    this.doc.roundedRect(LAYOUT.margin.left, y, LAYOUT.pageWidth - 2 * LAYOUT.margin.left, 25, 5, 5, 'F')

    this.doc.setTextColor(...LAYOUT.colors.muted)
    this.doc.setFontSize(LAYOUT.fonts.tiny)
    this.doc.setFont('helvetica', 'normal')
    this.centralizarTexto('Sistema desenvolvido pela IA Team • Versão 2.0 • Tecnologia avançada de marcação jurídica', y + 15)
  }

  private gerarConteudoCompleto(leis: LeiPDF[]): void {
    this.doc.addPage()
    this.currentPage++
    this.currentY = LAYOUT.margin.top
    this.currentColumn = 'left'

    for (const lei of leis) {
      this.adicionarTituloLeiModerno(lei.nome)

      // Ordenar artigos por número crescente
      const artigosOrdenados = [...lei.artigos].sort((a, b) => a.numero - b.numero)

      for (const artigo of artigosOrdenados) {
        this.adicionarArtigoModerno(artigo)
      }

      // Espaço entre leis
      this.adicionarEspaco(20)
    }
  }

  private gerarSumario(leis: LeiPDF[]): void {
    this.doc.addPage()
    this.currentPage++

    // Header moderno do sumário
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(0, 0, LAYOUT.pageWidth, 35, 'F')

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(LAYOUT.fonts.title)
    this.doc.setFont('helvetica', 'bold')
    this.centralizarTexto('SUMÁRIO GERAL', 25)

    let y = 60
    this.doc.setTextColor(...LAYOUT.colors.text)

    leis.forEach((lei, index) => {
      const paginaInicio = this.currentPage + 1 + Math.floor(index * 2) // Estimativa melhorada
      const artigosMarcados = lei.artigos.filter(a => a.marcado).length

      // Container da lei
      this.doc.setFillColor(...LAYOUT.colors.light)
      this.doc.roundedRect(LAYOUT.margin.left, y - 5, LAYOUT.pageWidth - 2 * LAYOUT.margin.left, 25, 3, 3, 'F')

      // Nome da lei
      this.doc.setTextColor(...LAYOUT.colors.text)
      this.doc.setFontSize(LAYOUT.fonts.subheading)
      this.doc.setFont('helvetica', 'bold')
      const nomeAbreviado = lei.nome.length > 60 ? `${lei.nome.substring(0, 60)}...` : lei.nome
      this.doc.text(nomeAbreviado, LAYOUT.margin.left + 5, y + 5)

      // Estatísticas
      this.doc.setTextColor(...LAYOUT.colors.muted)
      this.doc.setFontSize(LAYOUT.fonts.small)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        `${lei.artigos.length} artigos • ${artigosMarcados} marcados`,
        LAYOUT.margin.left + 5,
        y + 14
      )

      // Página (alinhada à direita)
      this.doc.setTextColor(...LAYOUT.colors.primary)
      this.doc.setFontSize(LAYOUT.fonts.body)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(
        `Pág. ${paginaInicio}`,
        LAYOUT.pageWidth - LAYOUT.margin.right - 25,
        y + 10
      )

      y += 35

      // Quebra de página se necessário
      if (y > LAYOUT.pageHeight - 60) {
        this.doc.addPage()
        this.currentPage++
        y = 40
      }
    })

    // Footer do sumário
    this.doc.setTextColor(...LAYOUT.colors.muted)
    this.doc.setFontSize(LAYOUT.fonts.tiny)
    this.doc.setFont('helvetica', 'normal')
    const totalArtigos = leis.reduce((sum, lei) => sum + lei.artigos.length, 0)
    const totalMarcados = leis.reduce((sum, lei) => sum + lei.artigos.filter(a => a.marcado).length, 0)
    this.centralizarTexto(
      `Total: ${leis.length} leis • ${totalArtigos} artigos • ${totalMarcados} marcados`,
      LAYOUT.pageHeight - 25
    )
  }

  private adicionarPaginaTransicao(config?: ConfigPDF): void {
    this.doc.addPage()
    this.currentPage++

    // Página de transição com design minimalista
    this.doc.setFillColor(...LAYOUT.colors.light)
    this.doc.rect(0, 0, LAYOUT.pageWidth, LAYOUT.pageHeight, 'F')

    // Título elegante centralizado
    this.doc.setTextColor(...LAYOUT.colors.primary)
    this.doc.setFontSize(LAYOUT.fonts.title)
    this.doc.setFont('helvetica', 'bold')
    const titulo = config?.tituloTransicao || 'LEGISLAÇÃO'
    this.centralizarTexto(titulo, LAYOUT.pageHeight / 2 - 20)

    // Subtítulo
    this.doc.setTextColor(...LAYOUT.colors.muted)
    this.doc.setFontSize(LAYOUT.fonts.subheading)
    this.doc.setFont('helvetica', 'normal')
    const subtitulo = config?.subtituloTransicao || 'Compilação de Artigos por Lei'
    this.centralizarTexto(subtitulo, LAYOUT.pageHeight / 2 + 10)

    // Linha decorativa
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(LAYOUT.pageWidth/2 - 40, LAYOUT.pageHeight / 2 + 20, 80, 1, 'F')
  }



  private adicionarTituloLeiModerno(nomeLei: string): void {
    // Verificar se precisa de nova página
    if (this.currentY > LAYOUT.margin.top + 40) {
      this.novaPagina()
    }

    // Reset para coluna esquerda e garantir altura correta
    this.currentColumn = 'left'
    // Sempre começar na altura padrão, sem header especial
    this.currentY = Math.max(this.currentY, LAYOUT.margin.top)

    // Título da lei mais discreto (sem fundo azul)
    this.doc.setTextColor(...LAYOUT.colors.primary)
    this.doc.setFontSize(LAYOUT.fonts.heading)
    this.doc.setFont('helvetica', 'bold')

    const nomeAbreviado = nomeLei.length > 85 ? `${nomeLei.substring(0, 85)}...` : nomeLei
    this.centralizarTexto(nomeAbreviado.toUpperCase(), this.currentY + 5)

    // Linha decorativa sutil
    this.doc.setFillColor(...LAYOUT.colors.primary)
    this.doc.rect(LAYOUT.pageWidth/2 - 50, this.currentY + 10, 100, 0.5, 'F')

    this.currentY += 20
  }

  private adicionarArtigoModerno(artigo: ArtigoPDF): void {
    // Processar texto do artigo - remover duplicidade do número
    let textoArtigo = artigo.texto.trim()

    // Remover "Art. X" do início do texto se já estiver lá para evitar duplicidade
    const regexArtigo = new RegExp(`^Art\\.?\\s*${artigo.numeroTexto}[ºª°]?[\\s\\-–—\\.]`, 'i')
    if (regexArtigo.test(textoArtigo)) {
      textoArtigo = textoArtigo.replace(regexArtigo, '').trim()
    }

    // Configurar fonte para cálculo preciso
    this.doc.setFontSize(LAYOUT.fonts.body)
    this.doc.setFont('helvetica', 'normal')

    // Calcular linhas de texto com largura correta
    const larguraTexto = LAYOUT.column.width - 8 // Espaço para elementos visuais
    const linhasTexto = this.doc.splitTextToSize(textoArtigo, larguraTexto)

    // Calcular altura real necessária incluindo o número do artigo
    const alturaNumero = 8  // Aumentado para evitar sobreposição
    const alturaTexto = linhasTexto.length * LAYOUT.spacing.lineHeight
    const alturaPadding = 6  // Aumentado padding para melhor espaçamento
    const alturaArtigo = alturaNumero + alturaTexto + alturaPadding

    // Verificar se precisa mudar de coluna ou página ANTES de começar a renderizar
    const espacoDisponivel = LAYOUT.pageHeight - LAYOUT.margin.bottom - this.currentY

    // Se artigo for muito longo (mais de 80% da altura disponível em uma coluna), quebrar inteligentemente
    const alturaMaximaColuna = LAYOUT.pageHeight - LAYOUT.margin.bottom - (this.currentPage > 5 ? 30 : LAYOUT.margin.top)
    const isArtigoMuitoLongo = alturaArtigo > alturaMaximaColuna * 0.8

    if (isArtigoMuitoLongo) {
      // Para artigos muito longos, sempre começar em nova página
      if (this.currentColumn === 'right' || this.currentY > (this.currentPage > 5 ? 30 : LAYOUT.margin.top)) {
        this.novaPagina()
      }
      this.adicionarArtigoLongo(artigo, linhasTexto, textoArtigo)
      return
    }

    if (alturaArtigo + LAYOUT.spacing.articleSpacing > espacoDisponivel) {
      if (this.currentColumn === 'left') {
        // Mudar para coluna direita - calcular altura inicial correta
        this.currentColumn = 'right'
        // Sempre começar na mesma altura que a coluna esquerda começou
        this.currentY = this.currentPage > 5 ? 30 : LAYOUT.margin.top
      } else {
        // Nova página
        this.novaPagina()
      }
    }

    const startY = this.currentY
    const startX = this.getXPosition()

    // Background pastel e faixa colorida para artigos marcados - CORRIGIDO
    if (artigo.marcado && artigo.cor) {
      // Mapeamento direto das cores sem verificação condicional
      let corRGB: [number, number, number] | undefined

      switch (artigo.cor) {
        case 'verde':
          corRGB = [34, 197, 94]
          break
        case 'azul':
          corRGB = [59, 130, 246]
          break
        case 'amarelo':
          corRGB = [255, 193, 7]  // Amarelo mais claro
          break
        case 'laranja':
          corRGB = [255, 87, 34]  // Laranja mais distinto
          break
        case 'roxo':
          corRGB = [156, 39, 176]  // Roxo mais forte
          break
        case 'cinza':
          corRGB = [96, 125, 139]  // Cinza mais definido
          break
      }

      if (corRGB) {
        // Fundo pastel personalizado para cada cor para garantir visibilidade
        let corPastel: [number, number, number]

        switch (artigo.cor) {
          case 'verde':
            corPastel = [200, 255, 210]  // Verde pastel
            break
          case 'azul':
            corPastel = [200, 230, 255]  // Azul pastel
            break
          case 'amarelo':
            corPastel = [255, 248, 180]  // Amarelo pastel
            break
          case 'laranja':
            corPastel = [255, 220, 180]  // Laranja pastel
            break
          case 'roxo':
            corPastel = [230, 200, 255]  // Roxo pastel
            break
          case 'cinza':
            corPastel = [220, 220, 225]  // Cinza pastel
            break
          default:
            corPastel = [240, 240, 240]  // Fallback
        }

        this.doc.setFillColor(corPastel[0], corPastel[1], corPastel[2])
        this.doc.rect(startX, startY, LAYOUT.column.width, alturaArtigo, 'F')

        // Faixa lateral colorida EXATA do tamanho do artigo
        this.doc.setFillColor(corRGB[0], corRGB[1], corRGB[2])
        this.doc.rect(startX, startY, 4, alturaArtigo, 'F')

        // Círculo colorido posicionado ao lado do número do artigo
        this.doc.setFillColor(corRGB[0], corRGB[1], corRGB[2])
        const circleX = startX + LAYOUT.column.width - 8 // Lado direito da coluna
        const circleY = startY + 4 // Alinhado com o número do artigo
        this.doc.circle(circleX, circleY, 2.5, 'F')
      }
    }

    // Número do artigo (sempre mostrar, mesmo que não marcado)
    this.doc.setTextColor(...LAYOUT.colors.primary)
    this.doc.setFontSize(LAYOUT.fonts.subheading)
    this.doc.setFont('helvetica', 'bold')

    const textoX = startX + 6 // Espaço após a faixa colorida
    const numeroArtigo = `Art. ${artigo.numeroTexto}`
    this.doc.text(numeroArtigo, textoX, this.currentY + 5)
    this.currentY += alturaNumero + 2  // Espaço adicional para evitar sobreposição

    // Texto do artigo (sem duplicidade do número)
    this.doc.setTextColor(...LAYOUT.colors.text)
    this.doc.setFontSize(LAYOUT.fonts.body)
    this.doc.setFont('helvetica', 'normal')

    for (const linha of linhasTexto) {
      // Verificar se ainda cabe na página/coluna atual
      if (this.currentY + LAYOUT.spacing.lineHeight > LAYOUT.pageHeight - LAYOUT.margin.bottom) {
        if (this.currentColumn === 'left') {
          this.currentColumn = 'right'
          // Manter consistência na altura inicial da coluna direita
          this.currentY = this.currentPage > 5 ? 30 : LAYOUT.margin.top
        } else {
          this.novaPagina()
        }
        // Recalcular X após mudança de coluna/página
        const novoX = this.getXPosition() + 6
        this.doc.text(linha, novoX, this.currentY)
      } else {
        this.doc.text(linha, textoX, this.currentY)
      }
      this.currentY += LAYOUT.spacing.lineHeight
    }

    // Espaçamento após o artigo
    this.currentY += LAYOUT.spacing.articleSpacing
  }

  private adicionarArtigoLongo(artigo: ArtigoPDF, linhasTexto: string[], textoArtigo: string): void {
    const startY = this.currentY
    const startX = this.getXPosition()

    // Background pastel e faixa colorida para artigos marcados
    if (artigo.marcado && artigo.cor) {
      let corRGB: [number, number, number] | undefined

      switch (artigo.cor) {
        case 'verde':
          corRGB = [34, 197, 94]
          break
        case 'azul':
          corRGB = [59, 130, 246]
          break
        case 'amarelo':
          corRGB = [255, 193, 7]
          break
        case 'laranja':
          corRGB = [255, 87, 34]
          break
        case 'roxo':
          corRGB = [156, 39, 176]
          break
        case 'cinza':
          corRGB = [96, 125, 139]
          break
      }

      if (corRGB) {
        // Para artigos longos, aplicar o fundo apenas na primeira seção
        let corPastel: [number, number, number]
        switch (artigo.cor) {
          case 'verde':
            corPastel = [200, 255, 210]
            break
          case 'azul':
            corPastel = [200, 230, 255]
            break
          case 'amarelo':
            corPastel = [255, 248, 180]
            break
          case 'laranja':
            corPastel = [255, 220, 180]
            break
          case 'roxo':
            corPastel = [230, 200, 255]
            break
          case 'cinza':
            corPastel = [220, 220, 225]
            break
          default:
            corPastel = [240, 240, 240]
        }

        // Aplicar fundo apenas ao cabeçalho do artigo
        const alturaCabecalho = 15
        this.doc.setFillColor(corPastel[0], corPastel[1], corPastel[2])
        this.doc.rect(startX, startY, LAYOUT.column.width, alturaCabecalho, 'F')

        // Faixa lateral colorida apenas no cabeçalho
        this.doc.setFillColor(corRGB[0], corRGB[1], corRGB[2])
        this.doc.rect(startX, startY, 4, alturaCabecalho, 'F')

        // Círculo colorido posicionado ao lado do número do artigo
        this.doc.setFillColor(corRGB[0], corRGB[1], corRGB[2])
        const circleX = startX + LAYOUT.column.width - 8
        const circleY = startY + 4
        this.doc.circle(circleX, circleY, 2.5, 'F')
      }
    }

    // Número do artigo
    this.doc.setTextColor(...LAYOUT.colors.primary)
    this.doc.setFontSize(LAYOUT.fonts.subheading)
    this.doc.setFont('helvetica', 'bold')

    const textoX = startX + 6
    const numeroArtigo = `Art. ${artigo.numeroTexto}`
    this.doc.text(numeroArtigo, textoX, this.currentY + 5)
    this.currentY += 10

    // Texto do artigo com quebras inteligentes
    this.doc.setTextColor(...LAYOUT.colors.text)
    this.doc.setFontSize(LAYOUT.fonts.body)
    this.doc.setFont('helvetica', 'normal')

    for (let i = 0; i < linhasTexto.length; i++) {
      const linha = linhasTexto[i]

      // Verificar se ainda cabe na página/coluna atual
      if (this.currentY + LAYOUT.spacing.lineHeight > LAYOUT.pageHeight - LAYOUT.margin.bottom) {
        if (this.currentColumn === 'left') {
          // Mudar para coluna direita
          this.currentColumn = 'right'
          this.currentY = this.currentPage > 5 ? 30 : LAYOUT.margin.top

          // Adicionar indicador de continuação na coluna direita
          this.doc.setTextColor(...LAYOUT.colors.muted)
          this.doc.setFontSize(LAYOUT.fonts.tiny)
          this.doc.setFont('helvetica', 'italic')
          this.doc.text(`[...continuação Art. ${artigo.numeroTexto}]`, this.getXPosition() + 6, this.currentY)
          this.currentY += 8

          this.doc.setTextColor(...LAYOUT.colors.text)
          this.doc.setFontSize(LAYOUT.fonts.body)
          this.doc.setFont('helvetica', 'normal')
        } else {
          // Nova página
          this.novaPagina()

          // Adicionar indicador de continuação na nova página
          this.doc.setTextColor(...LAYOUT.colors.muted)
          this.doc.setFontSize(LAYOUT.fonts.tiny)
          this.doc.setFont('helvetica', 'italic')
          this.doc.text(`[...continuação Art. ${artigo.numeroTexto}]`, this.getXPosition() + 6, this.currentY)
          this.currentY += 8

          this.doc.setTextColor(...LAYOUT.colors.text)
          this.doc.setFontSize(LAYOUT.fonts.body)
          this.doc.setFont('helvetica', 'normal')
        }
      }

      // Renderizar linha atual
      this.doc.text(linha, this.getXPosition() + 6, this.currentY)
      this.currentY += LAYOUT.spacing.lineHeight
    }

    // Espaçamento após o artigo
    this.currentY += LAYOUT.spacing.articleSpacing
  }

  private novaPagina(): void {
    this.doc.addPage()
    this.currentPage++
    this.currentColumn = 'left'

    // Adicionar header discreto nas páginas de conteúdo (exceto capa, estatísticas, contracapa, sumário e transição)
    if (this.currentPage > 5) {
      // Header mais robusto para evitar sobreposições
      this.doc.setFillColor(...LAYOUT.colors.light)
      this.doc.rect(0, 0, LAYOUT.pageWidth, 20, 'F')

      this.doc.setTextColor(...LAYOUT.colors.muted)
      this.doc.setFontSize(LAYOUT.fonts.tiny)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('VADEMECUM JURÍDICO', LAYOUT.margin.left, 12)

      // Linha divisória mais fina
      this.doc.setDrawColor(...LAYOUT.colors.border)
      this.doc.setLineWidth(0.3)
      this.doc.line(0, 20, LAYOUT.pageWidth, 20)

      this.currentY = 30  // Posição inicial mais baixa para evitar sobreposição
    } else {
      this.currentY = LAYOUT.margin.top
    }
  }

  private getXPosition(): number {
    return this.currentColumn === 'left'
      ? LAYOUT.margin.left
      : LAYOUT.margin.left + LAYOUT.column.width + LAYOUT.column.gap
  }

  private adicionarEspaco(altura: number): void {
    this.currentY += altura
  }

  private centralizarTexto(texto: string, y: number): void {
    const larguraTexto = this.doc.getTextWidth(texto)
    const x = (LAYOUT.pageWidth - larguraTexto) / 2
    this.doc.text(texto, x, y)
  }

  private adicionarNumeracaoPaginas(): void {
    const totalPaginas = this.doc.getNumberOfPages()

    for (let i = 1; i <= totalPaginas; i++) {
      this.doc.setPage(i)

      // Pular numeração na capa (página 1)
      if (i === 1) continue

      this.doc.setTextColor(...LAYOUT.colors.muted)
      this.doc.setFontSize(LAYOUT.fonts.tiny)
      this.doc.setFont('helvetica', 'normal')

      const textoPagina = `${i} / ${totalPaginas}`
      this.centralizarTexto(textoPagina, LAYOUT.pageHeight - 8)
    }
  }

  private configurarMetadados(config: ConfigPDF): void {
    this.doc.setProperties({
      title: config.titulo,
      subject: `Vademecum para ${config.concurso || 'Concurso'}`,
      author: config.autor || 'Vademecum Editor',
      creator: 'Vademecum Editor - Sistema de Marcação Estatística',
      keywords: 'vademecum, leis, artigos, concurso, marcação'
    })
  }
}
