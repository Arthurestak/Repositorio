import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Alert, AlertDescription } from './components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import {
  Upload,
  Edit,
  Palette,
  Eye,
  Download,
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  X,
  Filter
} from 'lucide-react'
import { VademecumPDFGenerator } from './lib/pdfGenerator'

// Tipos TypeScript
interface Artigo {
  id: number
  numero: number
  numeroTexto: string
  texto: string
  marcado: boolean
  cor: string | null
  tipo: 'artigo'
  anotacoes: string
  tags: string[]
  importancia: 1 | 2 | 3 | 4 | 5  // 1 = baixa, 5 = muito alta
  dataUltimaEdicao: string
}

interface Tag {
  id: string
  nome: string
  cor: string
  descricao: string
  categoria: 'juridica' | 'procedural' | 'temporal' | 'personalizada'
}

interface Template {
  id: string
  nome: string
  descricao: string
  categoria: string
  configuracao: {
    titulo: string
    legendaCores: Record<string, string>
    tagsPreDefinidas: Tag[]
    estruturaPadrao: string
  }
}

interface Lei {
  id: number
  nome: string
  textoCompleto: string
  artigos: Artigo[]
  categoria: string
  dataImportacao: string
}

interface Vademecum {
  leis: Lei[]
  legendaCores: Record<string, string>
  tagsPersonalizadas: Tag[]
  configuracoes: {
    templateAtivo: string | null
    exportarAnotacoes: boolean
    exportarTags: boolean
    mostrarImportancia: boolean
  }
}

interface Message {
  type: 'success' | 'error'
  text: string
}

// Cores disponíveis
const CORES = {
  verde: { bg: 'bg-green-500', text: 'text-green-500', label: 'Verde' },
  azul: { bg: 'bg-blue-500', text: 'text-blue-500', label: 'Azul' },
  amarelo: { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Amarelo' },
  laranja: { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Laranja' },
  roxo: { bg: 'bg-purple-500', text: 'text-purple-500', label: 'Roxo' },
  cinza: { bg: 'bg-gray-500', text: 'text-gray-500', label: 'Cinza' }
}

// Templates predefinidos
const TEMPLATES: Template[] = [
  {
    id: 'concurso-federal',
    nome: 'Concurso Federal',
    descricao: 'Template otimizado para concursos públicos federais',
    categoria: 'Público',
    configuracao: {
      titulo: 'Vademecum - Concurso Federal',
      legendaCores: {
        verde: 'Artigos mais cobrados em provas',
        azul: 'Jurisprudência STF/STJ',
        amarelo: 'Alterações legislativas recentes',
        laranja: 'Doutrina majoritária',
        roxo: 'Súmulas vinculantes',
        cinza: 'Dispositivos revogados'
      },
      tagsPreDefinidas: [
        { id: 'constitucional', nome: 'Constitucional', cor: '#dc2626', descricao: 'Direito Constitucional', categoria: 'juridica' },
        { id: 'administrativo', nome: 'Administrativo', cor: '#2563eb', descricao: 'Direito Administrativo', categoria: 'juridica' },
        { id: 'penal', nome: 'Penal', cor: '#7c2d12', descricao: 'Direito Penal', categoria: 'juridica' },
        { id: 'processual-penal', nome: 'Proc. Penal', cor: '#991b1b', descricao: 'Processo Penal', categoria: 'juridica' },
        { id: 'civil', nome: 'Civil', cor: '#059669', descricao: 'Direito Civil', categoria: 'juridica' },
        { id: 'processual-civil', nome: 'Proc. Civil', cor: '#0d9488', descricao: 'Processo Civil', categoria: 'juridica' }
      ],
      estruturaPadrao: 'Legislação organizada por frequência em provas'
    }
  },
  {
    id: 'oab',
    nome: 'Exame da OAB',
    descricao: 'Template especializado para o Exame da Ordem',
    categoria: 'OAB',
    configuracao: {
      titulo: 'Vademecum OAB',
      legendaCores: {
        verde: 'Temas frequentes na 1ª fase',
        azul: 'Temas frequentes na 2ª fase',
        amarelo: 'Novidades legislativas',
        laranja: 'Ética e Estatuto da OAB',
        roxo: 'Jurisprudência essencial',
        cinza: 'Complementar'
      },
      tagsPreDefinidas: [
        { id: 'primeira-fase', nome: '1ª Fase', cor: '#16a34a', descricao: 'Temas da primeira fase', categoria: 'procedural' },
        { id: 'segunda-fase', nome: '2ª Fase', cor: '#2563eb', descricao: 'Temas da segunda fase', categoria: 'procedural' },
        { id: 'etica', nome: 'Ética', cor: '#9333ea', descricao: 'Ética e Estatuto da OAB', categoria: 'juridica' },
        { id: 'pratico', nome: 'Prático', cor: '#ea580c', descricao: 'Aplicação prática', categoria: 'procedural' },
        { id: 'teoria', nome: 'Teoria', cor: '#0891b2', descricao: 'Aspectos teóricos', categoria: 'procedural' }
      ],
      estruturaPadrao: 'Organizado por disciplinas e fases do exame'
    }
  },
  {
    id: 'magistratura',
    nome: 'Magistratura',
    descricao: 'Template para concursos de magistratura',
    categoria: 'Magistratura',
    configuracao: {
      titulo: 'Vademecum - Magistratura',
      legendaCores: {
        verde: 'Jurisprudência consolidada',
        azul: 'Procedimentos judiciais',
        amarelo: 'Inovações processuais',
        laranja: 'Doutrina relevante',
        roxo: 'Temas polêmicos',
        cinza: 'Legislação complementar'
      },
      tagsPreDefinidas: [
        { id: 'stf', nome: 'STF', cor: '#dc2626', descricao: 'Supremo Tribunal Federal', categoria: 'juridica' },
        { id: 'stj', nome: 'STJ', cor: '#2563eb', descricao: 'Superior Tribunal de Justiça', categoria: 'juridica' },
        { id: 'sumula', nome: 'Súmula', cor: '#7c2d12', descricao: 'Súmulas dos tribunais', categoria: 'juridica' },
        { id: 'controversia', nome: 'Controvérsia', cor: '#ea580c', descricao: 'Temas controversos', categoria: 'procedural' },
        { id: 'prazo', nome: 'Prazo', cor: '#059669', descricao: 'Prazos processuais', categoria: 'temporal' }
      ],
      estruturaPadrao: 'Foco em jurisprudência e procedimentos judiciais'
    }
  },
  {
    id: 'advocacia-publica',
    nome: 'Advocacia Pública',
    descricao: 'Template para advocacia pública (AGU, PGE, etc.)',
    categoria: 'Advocacia',
    configuracao: {
      titulo: 'Vademecum - Advocacia Pública',
      legendaCores: {
        verde: 'Defesa da Fazenda Pública',
        azul: 'Responsabilidade Civil do Estado',
        amarelo: 'Execução Fiscal',
        laranja: 'Contratos Administrativos',
        roxo: 'Licitações e Contratos',
        cinza: 'Legislação Geral'
      },
      tagsPreDefinidas: [
        { id: 'fazenda-publica', nome: 'Fazenda Pública', cor: '#16a34a', descricao: 'Defesa da Fazenda', categoria: 'juridica' },
        { id: 'responsabilidade-civil', nome: 'Resp. Civil Estado', cor: '#2563eb', descricao: 'Responsabilidade do Estado', categoria: 'juridica' },
        { id: 'execucao-fiscal', nome: 'Execução Fiscal', cor: '#ea580c', descricao: 'Execução Fiscal', categoria: 'juridica' },
        { id: 'licitacao', nome: 'Licitação', cor: '#9333ea', descricao: 'Licitações e Contratos', categoria: 'juridica' },
        { id: 'administrativo', nome: 'Direito Admin.', cor: '#0891b2', descricao: 'Direito Administrativo', categoria: 'juridica' }
      ],
      estruturaPadrao: 'Especializado em temas de advocacia pública'
    }
  },
  {
    id: 'personalizado',
    nome: 'Personalizado',
    descricao: 'Template em branco para personalização completa',
    categoria: 'Personalizado',
    configuracao: {
      titulo: 'Meu Vademecum Personalizado',
      legendaCores: {
        verde: 'Categoria 1',
        azul: 'Categoria 2',
        amarelo: 'Categoria 3',
        laranja: 'Categoria 4',
        roxo: 'Categoria 5',
        cinza: 'Categoria 6'
      },
      tagsPreDefinidas: [
        { id: 'importante', nome: 'Importante', cor: '#dc2626', descricao: 'Conteúdo importante', categoria: 'personalizada' },
        { id: 'revisao', nome: 'Revisão', cor: '#ea580c', descricao: 'Para revisar', categoria: 'personalizada' },
        { id: 'memorizar', nome: 'Memorizar', cor: '#9333ea', descricao: 'Para memorizar', categoria: 'personalizada' }
      ],
      estruturaPadrao: 'Estrutura livre para personalização'
    }
  }
]

function App() {
  // Estados principais
  const [vademecum, setVademecum] = useState<Vademecum>({
    leis: [],
    legendaCores: {
      verde: 'Artigos mais cobrados',
      azul: 'Jurisprudência relevante',
      amarelo: 'Alterações recentes',
      laranja: 'Doutrina importante',
      roxo: 'Súmulas vinculantes',
      cinza: 'Observações gerais'
    },
    tagsPersonalizadas: [],
    configuracoes: {
      templateAtivo: null,
      exportarAnotacoes: true,
      exportarTags: true,
      mostrarImportancia: true
    }
  })

  const [leiSelecionada, setLeiSelecionada] = useState<number | null>(null)
  const [artigoSelecionado, setArtigoSelecionado] = useState<number | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [gerandoPDF, setGerandoPDF] = useState(false)

  // Estados de busca
  const [termoBusca, setTermoBusca] = useState('')
  const [filtroLei, setFiltroLei] = useState<number | null>(null)
  const [filtroCor, setFiltroCor] = useState<string | null>(null)
  const [filtroMarcados, setFiltroMarcados] = useState<'todos' | 'marcados' | 'nao-marcados'>('todos')
  const [tipoOrdenacao, setTipoOrdenacao] = useState<'relevancia' | 'numero' | 'lei'>('relevancia')
  const [resultadosBusca, setResultadosBusca] = useState<Array<{
    lei: Lei,
    artigo: Artigo,
    destaque: string,
    score: number
  }>>([])
  const [historicoBusca, setHistoricoBusca] = useState<string[]>([])
  const [sugestoesBusca, setSugestoesBusca] = useState<string[]>([])
  const [buscaAvancada, setBuscaAvancada] = useState(false)

  // Estados do formulário
  const [nomeNovaLei, setNomeNovaLei] = useState('')
  const [textoNovaLei, setTextoNovaLei] = useState('')
  const [tituloVademecum, setTituloVademecum] = useState('Vademecum Estatístico')
  const [nomeConcurso, setNomeConcurso] = useState('')
  const [autorVademecum, setAutorVademecum] = useState('')
  const [codigoVademecum, setCodigoVademecum] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [avisosVademecum, setAvisosVademecum] = useState('')
  const [comentariosVademecum, setComentariosVademecum] = useState('')
  const [edicaoVademecum, setEdicaoVademecum] = useState('1ª Edição')
  const [anoVademecum, setAnoVademecum] = useState(new Date().getFullYear().toString())
  const [tituloTransicao, setTituloTransicao] = useState('LEGISLAÇÃO')
  const [subtituloTransicao, setSubtituloTransicao] = useState('Compilação de Artigos por Lei')

  // Estados para edição e cores flutuantes
  const [textoEditavel, setTextoEditavel] = useState('')
  const [mostrarCoresFlutantes, setMostrarCoresFlutantes] = useState(false)
  const [posicaoCores, setPosicaoCores] = useState({ x: 0, y: 0 })

  // Estados para anotações e tags
  const [anotacoesEditaveis, setAnotacoesEditaveis] = useState('')
  const [tagsEditaveis, setTagsEditaveis] = useState<string[]>([])
  const [importanciaEditavel, setImportanciaEditavel] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [mostrarGerenciadorTags, setMostrarGerenciadorTags] = useState(false)
  const [novaTag, setNovaTag] = useState('')
  const [descricaoNovaTag, setDescricaoNovaTag] = useState('')
  const [corNovaTag, setCorNovaTag] = useState('#3b82f6')
  const [categoriaNovaTag, setCategoriaNovaTag] = useState<'juridica' | 'procedural' | 'temporal' | 'personalizada'>('personalizada')

  // Estados para templates
  const [mostrarTemplates, setMostrarTemplates] = useState(false)
  const [templateSelecionado, setTemplateSelecionado] = useState<string | null>(null)

  // Carregar dados do localStorage
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('vademecum-data')
    if (dadosSalvos) {
      try {
        setVademecum(JSON.parse(dadosSalvos))
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error)
      }
    }
  }, [])

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('vademecum-data', JSON.stringify(vademecum))
  }, [vademecum])

  // Função para mostrar mensagens
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Função para processar artigos de uma lei
  const processarArtigos = (texto: string): Artigo[] => {
    const linhas = texto.split('\n').filter(linha => linha.trim())
    const artigos: Artigo[] = []
    let artigoAtual: Artigo | null = null

    for (const linha of linhas) {
      const linhaTrimmed = linha.trim()
      if (!linhaTrimmed) continue

      // Detectar início de artigo
      const matchArtigo = linhaTrimmed.match(/^Art\.?\s*(\d+)[ºª°]?[\s\-–—\.]/i)

      if (matchArtigo) {
        // Salvar artigo anterior se existir
        if (artigoAtual) {
          artigos.push(artigoAtual)
        }

        // Iniciar novo artigo
        artigoAtual = {
          id: Date.now() + Math.random() * 1000000,
          numero: Number.parseInt(matchArtigo[1]),
          numeroTexto: matchArtigo[1],
          texto: linhaTrimmed,
          marcado: false,
          cor: null,
          tipo: 'artigo',
          anotacoes: '',
          tags: [],
          importancia: 3,
          dataUltimaEdicao: new Date().toISOString()
        }
      } else if (artigoAtual) {
        // Adicionar linha ao artigo atual
        artigoAtual.texto += `\n${linhaTrimmed}`
      }
    }

    // Adicionar último artigo se existir
    if (artigoAtual) {
      artigos.push(artigoAtual)
    }

    // Ordenar artigos por número
    artigos.sort((a, b) => a.numero - b.numero)
    return artigos
  }

  // Função para adicionar nova lei
  const adicionarLei = () => {
    if (!nomeNovaLei.trim() || !textoNovaLei.trim()) {
      showMessage('error', 'Por favor, preencha o nome e o texto da lei')
      return
    }

    const artigos = processarArtigos(textoNovaLei)

    if (artigos.length === 0) {
      showMessage('error', 'Nenhum artigo foi encontrado no texto')
      return
    }

    const novaLei: Lei = {
      id: Date.now(),
      nome: nomeNovaLei,
      textoCompleto: textoNovaLei,
      artigos: artigos,
      categoria: 'Geral',
      dataImportacao: new Date().toISOString()
    }

    setVademecum(prev => ({
      ...prev,
      leis: [...prev.leis, novaLei]
    }))

    // Limpar formulário
    setNomeNovaLei('')
    setTextoNovaLei('')

    showMessage('success', `Lei "${nomeNovaLei}" adicionada com ${artigos.length} artigos`)
  }

  // Função para carregar exemplo de lei para demonstração
  const carregarExemplo = () => {
    const exemploLei: Lei = {
      id: Date.now(),
      nome: "Código de Defesa do Consumidor - Lei nº 8.078/1990",
      categoria: "Direito do Consumidor",
      dataImportacao: new Date().toISOString(),
      textoCompleto: `Dispõe sobre a proteção do consumidor e dá outras providências.

O PRESIDENTE DA REPÚBLICA, faço saber que o Congresso Nacional decreta e eu sanciono a seguinte lei:

TÍTULO I
Dos Direitos do Consumidor

CAPÍTULO I
Disposições Gerais

Art. 1° O presente código estabelece normas de proteção e defesa do consumidor, de ordem pública e interesse social, nos termos dos arts. 5°, inciso XXXII, 170, inciso V, da Constituição Federal e art. 48 de suas Disposições Transitórias.

Art. 2° Consumidor é toda pessoa física ou jurídica que adquire ou utiliza produto ou serviço como destinatário final.

Parágrafo único. Equipara-se a consumidor a coletividade de pessoas, ainda que indetermináveis, que haja intervindo nas relações de consumo.

Art. 3° Fornecedor é toda pessoa física ou jurídica, pública ou privada, nacional ou estrangeira, bem como os entes despersonalizados, que desenvolvem atividade de produção, montagem, criação, construção, transformação, importação, exportação, distribuição ou comercialização de produtos ou prestação de serviços.

§ 1° Produto é qualquer bem, móvel ou imóvel, material ou imaterial.

§ 2° Serviço é qualquer atividade fornecida no mercado de consumo, mediante remuneração, inclusive as de natureza bancária, financeira, de crédito e securitária, salvo as decorrentes das relações de caráter trabalhista.

CAPÍTULO II
Da Política Nacional de Relações de Consumo

Art. 4º A Política Nacional das Relações de Consumo tem por objetivo o atendimento das necessidades dos consumidores, o respeito à sua dignidade, saúde e segurança, a proteção de seus interesses econômicos, a melhoria da sua qualidade de vida, bem como a transparência e harmonia das relações de consumo, atendidos os seguintes princípios: (Redação dada pela Lei nº 9.008, de 21.3.1995)

I - reconhecimento da vulnerabilidade do consumidor no mercado de consumo;

II - ação governamental no sentido de proteger efetivamente o consumidor:

a) por iniciativa direta;

b) por incentivos à criação e desenvolvimento de associações representativas;

c) pela presença do Estado no mercado de consumo;

d) pela garantia dos produtos e serviços com padrões adequados de qualidade, segurança, durabilidade e desempenho.

III - harmonização dos interesses dos participantes das relações de consumo e compatibilização da proteção do consumidor com a necessidade de desenvolvimento econômico e tecnológico, de modo a viabilizar os princípios nos quais se funda a ordem econômica (art. 170, da Constituição Federal), sempre com base na boa-fé e equilíbrio nas relações entre consumidores e fornecedores;

IV - educação e informação de fornecedores e consumidores, quanto aos seus direitos e deveres, com vistas à melhoria do mercado de consumo;

V - incentivo à criação pelos fornecedores de meios eficientes de controle de qualidade e segurança de produtos e serviços, assim como de mecanismos alternativos de solução de conflitos de consumo;

VI - coibição e repressão eficientes de todos os abusos praticados no mercado de consumo, inclusive a concorrência desleal e utilização indevida de inventos e criações industriais das marcas e nomes comerciais e signos distintivos, que possam causar prejuízos aos consumidores;

VII - racionalização e melhoria dos serviços públicos;

VIII - estudo constante das modificações do mercado de consumo.

IX - fomento de ações direcionadas à educação financeira e ambiental dos consumidores; (Incluído pela Lei nº 14.181, de 2021)

X - prevenção e tratamento do superendividamento como forma de evitar a exclusão social do consumidor. (Incluído pela Lei nº 14.181, de 2021)

Art. 5° Para a execução da Política Nacional das Relações de Consumo, contará o poder público com os seguintes instrumentos, entre outros:

I - manutenção de assistência jurídica, integral e gratuita para o consumidor carente;

II - instituição de Promotorias de Justiça de Defesa do Consumidor, no âmbito do Ministério Público;

III - criação de delegacias de polícia especializadas no atendimento de consumidores vítimas de infrações penais de consumo;

IV - criação de Juizados Especiais de Pequenas Causas e Varas Especializadas para a solução de litígios de consumo;

V - concessão de estímulos à criação e desenvolvimento das Associações de Defesa do Consumidor.

VI - instituição de mecanismos de prevenção e tratamento extrajudicial e judicial do superendividamento e de proteção do consumidor pessoa natural; (Incluído pela Lei nº 14.181, de 2021)

VII - instituição de núcleos de conciliação e mediação de conflitos oriundos de superendividamento. (Incluído pela Lei nº 14.181, de 2021)

§ 1° (Vetado).

§ 2º (Vetado).`,
      artigos: [] as Artigo[]
    }

    // Processar artigos
    const artigos = processarArtigos(exemploLei.textoCompleto)
    exemploLei.artigos = artigos

    setVademecum(prev => ({
      ...prev,
      leis: [...prev.leis, exemploLei]
    }))

    showMessage('success', `Exemplo do CDC carregado com ${artigos.length} artigos`)
  }

  // Função para marcar artigo
  const marcarArtigo = (cor: string) => {
    if (!leiSelecionada || !artigoSelecionado) {
      showMessage('error', 'Selecione uma lei e um artigo primeiro')
      return
    }

    setVademecum(prev => ({
      ...prev,
      leis: prev.leis.map(lei =>
        lei.id === leiSelecionada
          ? {
              ...lei,
              artigos: lei.artigos.map(artigo =>
                artigo.id === artigoSelecionado
                  ? { ...artigo, marcado: true, cor, texto: textoEditavel || artigo.texto }
                  : artigo
              )
            }
          : lei
      )
    }))

    setMostrarCoresFlutantes(false)
    showMessage('success', `Artigo marcado com a cor ${CORES[cor as keyof typeof CORES]?.label || cor}`)
  }

  // Função para mostrar cores flutuantes
  const mostrarPaletaCores = (event: React.MouseEvent) => {
    if (!artigoSelecionado) return

    const rect = event.currentTarget.getBoundingClientRect()
    setPosicaoCores({
      x: rect.right + 10,
      y: rect.top
    })
    setMostrarCoresFlutantes(true)
  }

  // Função para salvar texto editado
  const salvarTextoEditado = () => {
    if (!leiSelecionada || !artigoSelecionado) return

    setVademecum(prev => ({
      ...prev,
      leis: prev.leis.map(lei =>
        lei.id === leiSelecionada
          ? {
              ...lei,
              artigos: lei.artigos.map(artigo =>
                artigo.id === artigoSelecionado
                  ? {
                      ...artigo,
                      texto: textoEditavel,
                      anotacoes: anotacoesEditaveis,
                      tags: tagsEditaveis,
                      importancia: importanciaEditavel,
                      dataUltimaEdicao: new Date().toISOString()
                    }
                  : artigo
              )
            }
          : lei
      )
    }))

    showMessage('success', 'Artigo atualizado com texto, anotações e tags')
  }

  // Função para criar nova tag
  const criarNovaTag = () => {
    if (!novaTag.trim()) {
      showMessage('error', 'Digite um nome para a tag')
      return
    }

    const tag: Tag = {
      id: Date.now().toString(),
      nome: novaTag.trim(),
      descricao: descricaoNovaTag.trim(),
      cor: corNovaTag,
      categoria: categoriaNovaTag
    }

    setVademecum(prev => ({
      ...prev,
      tagsPersonalizadas: [...prev.tagsPersonalizadas, tag]
    }))

    setNovaTag('')
    setDescricaoNovaTag('')
    setCorNovaTag('#3b82f6')
    setCategoriaNovaTag('personalizada')

    showMessage('success', `Tag "${tag.nome}" criada com sucesso`)
  }

  // Função para adicionar tag ao artigo
  const adicionarTagAoArtigo = (tagNome: string) => {
    if (tagsEditaveis.includes(tagNome)) {
      setTagsEditaveis(prev => prev.filter(t => t !== tagNome))
    } else {
      setTagsEditaveis(prev => [...prev, tagNome])
    }
  }

  // Função para remover tag
  const removerTag = (tagId: string) => {
    setVademecum(prev => ({
      ...prev,
      tagsPersonalizadas: prev.tagsPersonalizadas.filter(t => t.id !== tagId)
    }))
    showMessage('success', 'Tag removida')
  }

  // Função para aplicar template
  const aplicarTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    setVademecum(prev => ({
      ...prev,
      legendaCores: template.configuracao.legendaCores,
      tagsPersonalizadas: template.configuracao.tagsPreDefinidas,
      configuracoes: {
        ...prev.configuracoes,
        templateAtivo: templateId
      }
    }))

    setTituloVademecum(template.configuracao.titulo)
    setTemplateSelecionado(templateId)
    setMostrarTemplates(false)

    showMessage('success', `Template "${template.nome}" aplicado com sucesso`)
  }

  // Calcular estatísticas
  const stats = {
    totalLeis: vademecum.leis.length,
    totalArtigos: vademecum.leis.reduce((sum, lei) => sum + lei.artigos.length, 0),
    totalMarcados: vademecum.leis.reduce((sum, lei) =>
      sum + lei.artigos.filter(a => a.marcado).length, 0),
    coresUsadas: new Set(
      vademecum.leis.flatMap(lei =>
        lei.artigos.filter(a => a.marcado).map(a => a.cor)
      )
    ).size
  }

  const leiAtual = vademecum.leis.find(lei => lei.id === leiSelecionada)
  const artigoAtual = leiAtual?.artigos.find(a => a.id === artigoSelecionado)

  // Sincronizar texto editável quando artigo for selecionado
  useEffect(() => {
    if (artigoAtual) {
      setTextoEditavel(artigoAtual.texto)
      setAnotacoesEditaveis(artigoAtual.anotacoes || '')
      setTagsEditaveis(artigoAtual.tags || [])
      setImportanciaEditavel(artigoAtual.importancia || 3)
    } else {
      setTextoEditavel('')
      setAnotacoesEditaveis('')
      setTagsEditaveis([])
      setImportanciaEditavel(3)
    }
  }, [artigoAtual])

  // Função para calcular similaridade fuzzy
  const calcularSimilaridade = useCallback((texto1: string, texto2: string): number => {
    const s1 = texto1.toLowerCase()
    const s2 = texto2.toLowerCase()

    if (s1 === s2) return 1
    if (s1.includes(s2) || s2.includes(s1)) return 0.8

    // Algoritmo simples de Levenshtein distance
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null))

    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }

    const maxLen = Math.max(s1.length, s2.length)
    return 1 - matrix[s2.length][s1.length] / maxLen
  }, [])

  // Função de busca melhorada
  const realizarBusca = useCallback(() => {
    if (!termoBusca.trim()) {
      setResultadosBusca([])
      setSugestoesBusca([])
      return
    }

    // Adicionar ao histórico se for novo
    if (!historicoBusca.includes(termoBusca) && termoBusca.length > 2) {
      setHistoricoBusca(prev => [termoBusca, ...prev.slice(0, 4)])
    }

    const resultados: Array<{lei: Lei, artigo: Artigo, destaque: string, score: number}> = []
    const termo = termoBusca.toLowerCase()
    const sugestoes = new Set<string>()

    for (const lei of vademecum.leis) {
      // Filtrar por lei se especificado
      if (filtroLei && lei.id !== filtroLei) continue

      for (const artigo of lei.artigos) {
        // Filtrar por cor se especificado
        if (filtroCor && artigo.cor !== filtroCor) continue

        // Filtrar por status de marcação
        if (filtroMarcados === 'marcados' && !artigo.marcado) continue
        if (filtroMarcados === 'nao-marcados' && artigo.marcado) continue

        // Buscar por número de artigo (exato e fuzzy)
        const numeroExato = artigo.numeroTexto.includes(termo) || artigo.numero.toString().includes(termo)
        const numeroFuzzy = calcularSimilaridade(artigo.numero.toString(), termo) > 0.7

        // Buscar no texto do artigo (exato e fuzzy)
        const textoLower = artigo.texto.toLowerCase()
        const textoExato = textoLower.includes(termo)

        // Busca por palavras-chave
        const palavras = termo.split(' ').filter(p => p.length > 2)
        const palavrasEncontradas = palavras.filter(palavra => textoLower.includes(palavra))
        const porcentagemPalavras = palavras.length > 0 ? palavrasEncontradas.length / palavras.length : 0

        let score = 0
        let destaque = ''

        if (numeroExato) {
          score += 10
          destaque = `Art. ${artigo.numeroTexto}`
        } else if (numeroFuzzy) {
          score += 7
          destaque = `Art. ${artigo.numeroTexto} (similar)`
        }

        if (textoExato) {
          score += 5
          // Encontrar trecho com destaque
          const indice = textoLower.indexOf(termo)
          const inicio = Math.max(0, indice - 50)
          const fim = Math.min(artigo.texto.length, indice + termo.length + 50)
          const trecho = artigo.texto.substring(inicio, fim)

          // Destacar o termo encontrado
          const regex = new RegExp(`(${termo})`, 'gi')
          destaque = trecho.replace(regex, '**$1**')

          if (inicio > 0) destaque = `...${destaque}`
          if (fim < artigo.texto.length) destaque = `${destaque}...`
        } else if (porcentagemPalavras > 0.5) {
          score += Math.floor(porcentagemPalavras * 3)

          // Encontrar primeiro trecho com palavra-chave
          for (const palavra of palavrasEncontradas) {
            const indice = textoLower.indexOf(palavra)
            if (indice !== -1) {
              const inicio = Math.max(0, indice - 50)
              const fim = Math.min(artigo.texto.length, indice + palavra.length + 50)
              const trecho = artigo.texto.substring(inicio, fim)

              const regex = new RegExp(`(${palavra})`, 'gi')
              destaque = trecho.replace(regex, '**$1**')

              if (inicio > 0) destaque = `...${destaque}`
              if (fim < artigo.texto.length) destaque = `${destaque}...`
              break
            }
          }
        }

        // Bonus para artigos marcados
        if (artigo.marcado) score += 2

        // Bonus para cores específicas
        if (artigo.cor === 'verde') score += 1 // Artigos mais cobrados

        if (score > 0) {
          resultados.push({
            lei,
            artigo,
            destaque: destaque || `Art. ${artigo.numeroTexto}`,
            score
          })

          // Gerar sugestões baseadas no conteúdo
          const textoArtigo = artigo.texto.toLowerCase()
          for (const palavra of textoArtigo.split(/\s+/)) {
            if (palavra.length > 4 && palavra.includes(termo.substring(0, 3))) {
              sugestoes.add(palavra)
            }
          }
        }
      }
    }

    // Aplicar ordenação
    switch (tipoOrdenacao) {
      case 'relevancia':
        resultados.sort((a, b) => b.score - a.score)
        break
      case 'numero':
        resultados.sort((a, b) => a.artigo.numero - b.artigo.numero)
        break
      case 'lei':
        resultados.sort((a, b) => a.lei.nome.localeCompare(b.lei.nome))
        break
    }

    setResultadosBusca(resultados)
    setSugestoesBusca(Array.from(sugestoes).slice(0, 5))
  }, [termoBusca, filtroLei, filtroCor, filtroMarcados, tipoOrdenacao, vademecum, historicoBusca, calcularSimilaridade])

  // Buscar automaticamente quando o termo muda
  useEffect(() => {
    const timer = setTimeout(() => {
      realizarBusca()
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timer)
  }, [realizarBusca])

  // Função para limpar busca
  const limparBusca = () => {
    setTermoBusca('')
    setFiltroLei(null)
    setFiltroCor(null)
    setFiltroMarcados('todos')
    setTipoOrdenacao('relevancia')
    setResultadosBusca([])
    setHistoricoBusca([])
    setSugestoesBusca([])
    setBuscaAvancada(false)
  }

  // Função para gerar PDF
  const gerarPDF = async () => {
    if (vademecum.leis.length === 0) {
      showMessage('error', 'Adicione pelo menos uma lei antes de gerar o PDF')
      return
    }

    setGerandoPDF(true)

    try {
      // Preparar dados para o PDF - agora incluindo TODOS os artigos
      const leisPDF = vademecum.leis.map(lei => ({
        nome: lei.nome,
        artigos: lei.artigos.map(artigo => ({
          ...artigo,
          nomeFromLei: lei.nome
        }))
      }))

      const config = {
        titulo: tituloVademecum,
        concurso: nomeConcurso,
        autor: autorVademecum || 'Usuário do Vademecum Editor',
        codigo: codigoVademecum,
        empresa: nomeEmpresa,
        edicao: edicaoVademecum,
        ano: anoVademecum,
        avisos: avisosVademecum,
        comentarios: comentariosVademecum,
        tituloTransicao: tituloTransicao,
        subtituloTransicao: subtituloTransicao,
        legendaCores: vademecum.legendaCores
      }

      // Gerar PDF com layout moderno
      const pdfGenerator = new VademecumPDFGenerator()
      await pdfGenerator.gerarPDF(leisPDF, config)

      const totalArtigos = vademecum.leis.reduce((total, lei) => total + lei.artigos.length, 0)
      const artigosMarcados = vademecum.leis.reduce((total, lei) => {
        return total + lei.artigos.filter(a => a.marcado).length
      }, 0)

      showMessage('success', `PDF gerado com sucesso! ${totalArtigos} artigos incluídos (${artigosMarcados} marcados).`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      showMessage('error', 'Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGerandoPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Vademecum Estatístico</h1>
          <p className="text-gray-600">Editor profissional de leis com marcação colorida</p>
        </div>

        {/* Mensagem de Status */}
        {message && (
          <Alert className={`mb-4 ${message.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs Principal */}
        <Card className="shadow-lg">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importar
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cores
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </TabsTrigger>
            </TabsList>

            {/* Tab Templates */}
            <TabsContent value="templates">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Templates Predefinidos
                </CardTitle>
                <CardDescription>
                  Escolha um template otimizado para seu tipo de concurso ou estudo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TEMPLATES.map(template => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        vademecum.configuracoes.templateAtivo === template.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => aplicarTemplate(template.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{template.nome}</span>
                          {vademecum.configuracoes.templateAtivo === template.id && (
                            <Badge className="bg-blue-600 text-white">
                              ✓ Ativo
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {template.descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-2">Categoria:</div>
                            <Badge variant="outline" className="text-xs">
                              {template.categoria}
                            </Badge>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-2">Tags Incluídas:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.configuracao.tagsPreDefinidas.slice(0, 3).map(tag => (
                                <div
                                  key={tag.id}
                                  className="px-2 py-1 rounded text-xs text-white"
                                  style={{ backgroundColor: tag.cor }}
                                >
                                  {tag.nome}
                                </div>
                              ))}
                              {template.configuracao.tagsPreDefinidas.length > 3 && (
                                <div className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
                                  +{template.configuracao.tagsPreDefinidas.length - 3}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-2">Estrutura:</div>
                            <div className="text-xs text-gray-600 line-clamp-2">
                              {template.configuracao.estruturaPadrao}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {vademecum.configuracoes.templateAtivo && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Template Ativo
                      </span>
                    </div>
                    <p className="text-xs text-green-700">
                      Template "{TEMPLATES.find(t => t.id === vademecum.configuracoes.templateAtivo)?.nome}"
                      está configurado. As cores e tags foram aplicadas automaticamente.
                    </p>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            {/* Tab Import */}
            <TabsContent value="import">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Importar Nova Lei
                </CardTitle>
                <CardDescription>
                  Adicione uma nova lei ao seu vademecum. Cole o texto completo da lei.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Lei</label>
                  <Input
                    placeholder="Ex: Constituição Federal, Código Penal..."
                    value={nomeNovaLei}
                    onChange={(e) => setNomeNovaLei(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Texto da Lei</label>
                  <Textarea
                    rows={10}
                    placeholder="Cole aqui o texto completo da lei..."
                    value={textoNovaLei}
                    onChange={(e) => setTextoNovaLei(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={adicionarLei} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Lei
                  </Button>
                  <Button
                    onClick={carregarExemplo}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Carregar Exemplo (CDC)
                  </Button>
                </div>
              </CardContent>
            </TabsContent>

            {/* Tab Edit - Layout Reorganizado */}
            <TabsContent value="edit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Editar e Marcar Artigos
                </CardTitle>
                <CardDescription>
                  Selecione uma lei, clique em um artigo e escolha uma cor para marcá-lo
                </CardDescription>
              </CardHeader>

              {/* Header com Controles */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">Lei Selecionada:</div>
                    <Select value={leiSelecionada?.toString() || ''} onValueChange={(value) => {
                      setLeiSelecionada(value ? Number.parseInt(value) : null)
                      setArtigoSelecionado(null)
                    }}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione uma lei" />
                      </SelectTrigger>
                      <SelectContent>
                        {vademecum.leis.map(lei => (
                          <SelectItem key={lei.id} value={lei.id.toString()}>
                            {lei.nome.length > 40 ? `${lei.nome.substring(0, 40)}...` : lei.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {leiSelecionada && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setVademecum(prev => ({
                          ...prev,
                          leis: prev.leis.filter(lei => lei.id !== leiSelecionada)
                        }))
                        setLeiSelecionada(null)
                        setArtigoSelecionado(null)
                        showMessage('success', 'Lei excluída com sucesso')
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Excluir Lei
                    </Button>
                  )}
                </div>

                {/* Palette de Cores - Aparece quando artigo selecionado */}
                {artigoSelecionado && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-blue-800">
                        🎨 Marcar Artigo Selecionado
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArtigoSelecionado(null)}
                        className="h-6 w-6 p-0 text-blue-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {Object.entries(CORES).map(([cor, config]) => (
                        <Button
                          key={cor}
                          onClick={() => marcarArtigo(cor)}
                          className={`${config.bg} hover:opacity-80 text-white text-xs h-8`}
                          title={config.label}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                  {/* Coluna Esquerda - Artigos (Ocupa coluna inteira) */}
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Artigos</CardTitle>
                      {leiAtual && (
                        <CardDescription>
                          {leiAtual.artigos.length} artigos • {leiAtual.artigos.filter(a => a.marcado).length} marcados
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="h-[520px] overflow-y-auto">
                      {!leiAtual ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <FileText className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-sm">Selecione uma lei para ver os artigos</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {leiAtual.artigos.map(artigo => (
                            <div
                              key={artigo.id}
                              onClick={() => setArtigoSelecionado(artigo.id)}
                              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all ${
                                artigoSelecionado === artigo.id ? 'bg-blue-50 border-blue-500 shadow-md' : ''
                              } ${
                                artigo.marcado && artigo.cor ? `border-l-4 border-l-${artigo.cor}-500` : ''
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-sm">Art. {artigo.numeroTexto || artigo.numero}</div>
                                <div className="flex items-center gap-2">
                                  {artigo.marcado && artigo.cor && (
                                    <Badge className={`${CORES[artigo.cor as keyof typeof CORES]?.bg} text-white text-xs`}>
                                      {CORES[artigo.cor as keyof typeof CORES]?.label}
                                    </Badge>
                                  )}
                                  {artigoSelecionado === artigo.id && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-3">
                                {artigo.texto.substring(0, 200)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Coluna Direita - Preview Editável em Tempo Real */}
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Preview Editável</span>
                        {artigoSelecionado && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={salvarTextoEditado}
                              className="text-xs"
                            >
                              Salvar Edição
                            </Button>
                            <Button
                              size="sm"
                              onClick={mostrarPaletaCores}
                              className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                              🎨 Marcar
                            </Button>
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Edite o texto e marque com cores para destacar no PDF
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[520px] overflow-y-auto">
                      {leiAtual && artigoSelecionado ? (
                        <div className={`p-4 border-l-4 rounded-lg ${
                          artigoAtual?.marcado && artigoAtual?.cor
                            ? `border-l-${artigoAtual.cor}-500 bg-${artigoAtual.cor}-50`
                            : 'border-l-gray-300 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-base text-blue-600">
                              Art. {artigoAtual?.numeroTexto || artigoAtual?.numero}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Indicador de importância */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => setImportanciaEditavel(star as 1 | 2 | 3 | 4 | 5)}
                                    className={`w-4 h-4 ${
                                      star <= importanciaEditavel
                                        ? 'text-yellow-400 hover:text-yellow-500'
                                        : 'text-gray-300 hover:text-gray-400'
                                    }`}
                                  >
                                    ⭐
                                  </button>
                                ))}
                              </div>
                              {artigoAtual?.marcado && artigoAtual?.cor && (
                                <div className={`w-4 h-4 rounded-full ${CORES[artigoAtual.cor as keyof typeof CORES]?.bg}`} />
                              )}
                            </div>
                          </div>

                          {/* Texto do Artigo */}
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 mb-2">📝 Texto do Artigo</label>
                            <Textarea
                              value={textoEditavel}
                              onChange={(e) => setTextoEditavel(e.target.value)}
                              className="min-h-[200px] text-sm leading-relaxed resize-none border border-gray-200 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
                              placeholder="Edite o texto do artigo aqui..."
                            />
                          </div>

                          {/* Anotações */}
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 mb-2">💭 Anotações Pessoais</label>
                            <Textarea
                              value={anotacoesEditaveis}
                              onChange={(e) => setAnotacoesEditaveis(e.target.value)}
                              className="min-h-[80px] text-sm leading-relaxed resize-none border border-gray-200 p-3 rounded-md focus:ring-2 focus:ring-blue-500"
                              placeholder="Adicione suas anotações, observações, dicas de memorização..."
                            />
                          </div>

                          {/* Tags */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs font-medium text-gray-600">🏷️ Tags</label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMostrarGerenciadorTags(true)}
                                className="text-xs h-6"
                              >
                                Gerenciar Tags
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {vademecum.tagsPersonalizadas.map(tag => (
                                <Button
                                  key={tag.id}
                                  size="sm"
                                  variant={tagsEditaveis.includes(tag.nome) ? "default" : "outline"}
                                  onClick={() => adicionarTagAoArtigo(tag.nome)}
                                  className="text-xs h-7"
                                  style={{
                                    backgroundColor: tagsEditaveis.includes(tag.nome) ? tag.cor : 'transparent',
                                    borderColor: tag.cor,
                                    color: tagsEditaveis.includes(tag.nome) ? 'white' : tag.cor
                                  }}
                                >
                                  {tag.nome}
                                </Button>
                              ))}
                            </div>
                            {tagsEditaveis.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Tags selecionadas: {tagsEditaveis.join(', ')}
                              </div>
                            )}
                          </div>

                          {/* Status do artigo */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                              {artigoAtual?.marcado && artigoAtual?.cor && (
                                <Badge className={`${CORES[artigoAtual.cor as keyof typeof CORES]?.bg} text-white`}>
                                  📌 {CORES[artigoAtual.cor as keyof typeof CORES]?.label}
                                </Badge>
                              )}
                              {tagsEditaveis.map(tagNome => {
                                const tag = vademecum.tagsPersonalizadas.find(t => t.nome === tagNome)
                                return tag ? (
                                  <Badge
                                    key={tag.id}
                                    style={{ backgroundColor: tag.cor, color: 'white' }}
                                    className="text-xs"
                                  >
                                    {tag.nome}
                                  </Badge>
                                ) : null
                              })}
                              <Badge variant="outline" className="text-xs">
                                ⭐ {importanciaEditavel}/5
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <Edit className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-sm">Selecione um artigo para editar</p>
                          <p className="text-xs mt-2 text-center">
                            Você poderá editar o texto e marcar com cores
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </TabsContent>

            {/* Tab Search */}
            <TabsContent value="search">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Buscar Artigos
                </CardTitle>
                <CardDescription>
                  Encontre artigos específicos por número, texto ou filtros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Histórico de Buscas */}
                  {historicoBusca.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Buscas Recentes</label>
                      <div className="flex flex-wrap gap-2">
                        {historicoBusca.map((busca) => (
                          <Button
                            key={busca}
                            variant="outline"
                            size="sm"
                            onClick={() => setTermoBusca(busca)}
                            className="text-xs"
                          >
                            {busca}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botão de Busca Avançada */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Sistema de Busca</h3>
                    <Button
                      variant={buscaAvancada ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBuscaAvancada(!buscaAvancada)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      {buscaAvancada ? 'Busca Simples' : 'Busca Avançada'}
                    </Button>
                  </div>

                  {/* Barra de Busca e Filtros */}
                  <div className={`grid gap-4 ${buscaAvancada ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                    <div className={buscaAvancada ? '' : 'md:col-span-2'}>
                      <label className="block text-sm font-medium mb-2">Termo de Busca</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Digite número do artigo ou texto..."
                          value={termoBusca}
                          onChange={(e) => setTermoBusca(e.target.value)}
                          className="pl-10"
                        />
                        {termoBusca && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={limparBusca}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Sugestões de busca */}
                      {sugestoesBusca.length > 0 && termoBusca.length > 2 && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-500 mb-1">Sugestões:</label>
                          <div className="flex flex-wrap gap-1">
                            {sugestoesBusca.map((sugestao) => (
                              <Button
                                key={sugestao}
                                variant="ghost"
                                size="sm"
                                onClick={() => setTermoBusca(sugestao)}
                                className="text-xs h-6 px-2 text-blue-600 hover:text-blue-800"
                              >
                                {sugestao}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {buscaAvancada && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Filtrar por Lei</label>
                        <Select value={filtroLei?.toString() || ''} onValueChange={(value) => setFiltroLei(value ? Number.parseInt(value) : null)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as leis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as leis</SelectItem>
                            {vademecum.leis.map(lei => (
                              <SelectItem key={lei.id} value={lei.id.toString()}>
                                {lei.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {buscaAvancada && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Filtrar por Cor</label>
                        <Select value={filtroCor || ''} onValueChange={(value) => setFiltroCor(value || null)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as cores" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as cores</SelectItem>
                            {Object.entries(CORES).map(([cor, config]) => (
                              <SelectItem key={cor} value={cor}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                                  {config.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {buscaAvancada && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Filtrar por Marcados</label>
                        <Select value={filtroMarcados} onValueChange={(value) => setFiltroMarcados(value as 'todos' | 'marcados' | 'nao-marcados')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="marcados">Marcados</SelectItem>
                            <SelectItem value="nao-marcados">Não Marcados</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Ordenar por</label>
                      <Select value={tipoOrdenacao} onValueChange={(value) => setTipoOrdenacao(value as 'relevancia' | 'numero' | 'lei')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Relevância" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevancia">Relevância</SelectItem>
                          <SelectItem value="numero">Número</SelectItem>
                          <SelectItem value="lei">Lei</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Estatísticas de Busca */}
                  {termoBusca && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <div className="flex flex-col">
                          <span className="text-sm text-blue-800 font-medium">
                            {resultadosBusca.length > 0
                              ? `${resultadosBusca.length} resultado${resultadosBusca.length !== 1 ? 's' : ''} encontrado${resultadosBusca.length !== 1 ? 's' : ''}`
                              : 'Nenhum resultado encontrado'
                            }
                          </span>
                          {resultadosBusca.length > 0 && (
                            <span className="text-xs text-blue-600">
                              {buscaAvancada && `Busca: ${tipoOrdenacao} • `}
                              {filtroLei && 'Lei específica • '}
                              {filtroCor && `Cor: ${CORES[filtroCor as keyof typeof CORES]?.label} • `}
                              {filtroMarcados !== 'todos' && `${filtroMarcados === 'marcados' ? 'Marcados' : 'Não marcados'} • `}
                              Termo: "{termoBusca}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sugestoesBusca.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {sugestoesBusca.length} sugestões
                          </Badge>
                        )}
                        {(filtroLei || filtroCor || filtroMarcados !== 'todos' || buscaAvancada) && (
                          <Button variant="outline" size="sm" onClick={limparBusca}>
                            Limpar filtros
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resultados da Busca em Duas Colunas */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                    {resultadosBusca.length === 0 && termoBusca ? (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum resultado encontrado para "{termoBusca}"</p>
                        <p className="text-sm mt-2">Tente termos diferentes ou remova os filtros</p>
                      </div>
                    ) : !termoBusca ? (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Digite algo para começar a busca</p>
                        <p className="text-sm mt-2">Você pode buscar por número de artigo ou conteúdo</p>
                      </div>
                    ) : (
                      resultadosBusca.map((resultado, index) => (
                        <Card
                          key={`${resultado.lei.id}-${resultado.artigo.id}-${index}`}
                          className={`h-fit cursor-pointer hover:shadow-md transition-shadow ${
                            resultado.artigo.marcado && resultado.artigo.cor
                              ? `border-l-4 border-l-${resultado.artigo.cor}-500`
                              : ''
                          }`}
                          onClick={() => {
                            setLeiSelecionada(resultado.lei.id)
                            setArtigoSelecionado(resultado.artigo.id)
                            // Pode adicionar navegação para a aba de edição
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">Art. {resultado.artigo.numeroTexto || resultado.artigo.numero}</CardTitle>
                                {tipoOrdenacao === 'relevancia' && (
                                  <Badge variant="outline" className="text-xs">
                                    Score: {resultado.score}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {resultado.artigo.marcado && resultado.artigo.cor && (
                                  <Badge className={`${CORES[resultado.artigo.cor as keyof typeof CORES]?.bg} text-white text-xs`}>
                                    {CORES[resultado.artigo.cor as keyof typeof CORES]?.label}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription className="text-xs">{resultado.lei.nome}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-700">
                              {resultado.destaque.includes('**') ? (
                                resultado.destaque.split(/(\*\*.*?\*\*)/).map((parte, i) =>
                                  parte.startsWith('**') && parte.endsWith('**') ? (
                                    <mark key={`mark-${resultado.artigo.id}-${i}`} className="bg-yellow-200 px-1 rounded">
                                      {parte.slice(2, -2)}
                                    </mark>
                                  ) : (
                                    <span key={`span-${resultado.artigo.id}-${i}`}>{parte}</span>
                                  )
                                )
                              ) : (
                                <span>{resultado.destaque}</span>
                              )}
                            </div>
                            {resultado.artigo.marcado && (
                              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Artigo marcado
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Tab Colors */}
            <TabsContent value="colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Configuração de Cores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(CORES).map(([cor, config]) => (
                    <div key={cor} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-8 h-8 rounded ${config.bg}`} />
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">{config.label}</label>
                        <Input
                          value={vademecum.legendaCores[cor]}
                          onChange={(e) => setVademecum(prev => ({
                            ...prev,
                            legendaCores: {
                              ...prev.legendaCores,
                              [cor]: e.target.value
                            }
                          }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </TabsContent>

            {/* Tab Preview */}
            <TabsContent value="preview">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview do Vademecum
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="text-center bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalLeis}</div>
                      <div className="text-sm text-gray-600">Leis</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center bg-green-50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.totalArtigos}</div>
                      <div className="text-sm text-gray-600">Artigos</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-600">{stats.totalMarcados}</div>
                      <div className="text-sm text-gray-600">Marcados</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">{stats.coresUsadas}</div>
                      <div className="text-sm text-gray-600">Cores</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview dos Artigos Classificados por Cores */}
                <div className="space-y-6">
                  {Object.entries(CORES).map(([cor, config]) => {
                    const artigosDaCor = vademecum.leis.flatMap(lei =>
                      lei.artigos
                        .filter(a => a.marcado && a.cor === cor)
                        .map(artigo => ({ ...artigo, nomeLei: lei.nome }))
                    )

                    if (artigosDaCor.length === 0) return null

                    return (
                      <Card key={cor} className="overflow-hidden">
                        <CardHeader className={`${config.bg} text-white pb-3`}>
                          <CardTitle className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                            <span>{config.label}</span>
                            <Badge variant="secondary" className="bg-white bg-opacity-20 text-white">
                              {artigosDaCor.length} artigos
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-white text-opacity-90">
                            {vademecum.legendaCores[cor]}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {artigosDaCor.map((artigo, index) => (
                              <div
                                key={artigo.id}
                                className={`p-4 border-b border-r-0 lg:border-r ${
                                  index % 2 === 0 ? 'lg:border-r' : ''
                                } border-gray-200 bg-${cor}-50 hover:bg-${cor}-100 transition-colors`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="font-semibold text-sm text-gray-800">
                                    Art. {artigo.numeroTexto || artigo.numero}
                                  </div>
                                  <div className={`w-3 h-3 rounded-full ${config.bg} ml-2 mt-1 flex-shrink-0`} />
                                </div>
                                <div className="text-xs text-gray-600 mb-2 font-medium">
                                  📚 {artigo.nomeLei}
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                                  {artigo.texto}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {vademecum.leis.every(lei => lei.artigos.filter(a => a.marcado).length === 0) && (
                    <div className="text-center py-12">
                      <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum artigo marcado</h3>
                      <p className="text-gray-500">
                        Vá para a aba "Editar" para marcar artigos com cores
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </TabsContent>

            {/* Tab Export */}
            <TabsContent value="export">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Exportar Vademecum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-blue-50">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Seu vademecum incluirá:</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Capa moderna com design profissional</li>
                        <li>• Contracapa explicativa das cores de marcação</li>
                        <li>• Sumário geral com estatísticas completas</li>
                        <li>• Layout moderno em duas colunas balanceadas</li>
                        <li>• TODOS os artigos das leis importadas</li>
                        <li>• Artigos marcados com destaque especial</li>
                        <li>• Artigos ordenados numericamente</li>
                        <li>• Headers discretos e numeração automática</li>
                        <li>• Quebras inteligentes entre colunas e páginas</li>
                        <li>• Tipografia otimizada para leitura</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-green-900 mb-2">Estatísticas do PDF:</h3>
                      <div className="text-sm text-green-800 space-y-2">
                        <div className="flex justify-between">
                          <span>Leis importadas:</span>
                          <Badge variant="secondary">{stats.totalLeis}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Artigos marcados:</span>
                          <Badge variant="secondary">{stats.totalMarcados}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Cores utilizadas:</span>
                          <Badge variant="secondary">{stats.coresUsadas}</Badge>
                        </div>
                        {stats.totalArtigos > 0 && (
                          <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                            ✅ Pronto para gerar PDF completo
                          </div>
                        )}
                        {stats.totalArtigos === 0 && (
                          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                            ⚠️ Importe algumas leis primeiro
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Título do Vademecum *</label>
                    <Input
                      value={tituloVademecum}
                      onChange={(e) => setTituloVademecum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome do Concurso</label>
                    <Input
                      placeholder="Ex: Concurso TRF 2024"
                      value={nomeConcurso}
                      onChange={(e) => setNomeConcurso(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Autor</label>
                    <Input
                      placeholder="Nome do autor"
                      value={autorVademecum}
                      onChange={(e) => setAutorVademecum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Código/ISBN</label>
                    <Input
                      placeholder="Código de identificação"
                      value={codigoVademecum}
                      onChange={(e) => setCodigoVademecum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome da Empresa/Editora</label>
                    <Input
                      placeholder="Nome da empresa ou editora"
                      value={nomeEmpresa}
                      onChange={(e) => setNomeEmpresa(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Edição</label>
                    <Input
                      placeholder="Ex: 1ª Edição"
                      value={edicaoVademecum}
                      onChange={(e) => setEdicaoVademecum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ano</label>
                    <Input
                      placeholder="2024"
                      value={anoVademecum}
                      onChange={(e) => setAnoVademecum(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Avisos Importantes</label>
                    <Textarea
                      rows={3}
                      placeholder="Avisos, advertências ou informações importantes para o leitor..."
                      value={avisosVademecum}
                      onChange={(e) => setAvisosVademecum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Comentários e Observações</label>
                    <Textarea
                      rows={3}
                      placeholder="Comentários adicionais, metodologia, agradecimentos..."
                      value={comentariosVademecum}
                      onChange={(e) => setComentariosVademecum(e.target.value)}
                    />
                  </div>
                </div>

                {/* Personalização da Página de Transição */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Personalizar Página de Transição
                    </CardTitle>
                    <CardDescription>
                      Configure o título e subtítulo que aparecerão na página 5 (antes do conteúdo)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Título Principal</label>
                        <Input
                          value={tituloTransicao}
                          onChange={(e) => setTituloTransicao(e.target.value)}
                          placeholder="Ex: LEGISLAÇÃO"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Subtítulo</label>
                        <Input
                          value={subtituloTransicao}
                          onChange={(e) => setSubtituloTransicao(e.target.value)}
                          placeholder="Ex: Compilação de Artigos por Lei"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={gerarPDF}
                    disabled={gerandoPDF}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {gerandoPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Gerar PDF
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => showMessage('error', 'Exportação DOCX em desenvolvimento')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar DOCX
                  </Button>

                  <Button
                    onClick={() => showMessage('error', 'Exportação HTML em desenvolvimento')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar HTML
                  </Button>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Paleta de Cores Flutuante */}
        {mostrarCoresFlutantes && (
          <>
            {/* Overlay para fechar ao clicar fora */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMostrarCoresFlutantes(false)}
            />

            {/* Paleta de cores */}
            <div
              className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-in fade-in-0 zoom-in-95"
              style={{
                left: `${posicaoCores.x}px`,
                top: `${posicaoCores.y}px`,
                transform: 'translateY(-50%)'
              }}
            >
              <div className="text-xs font-medium text-gray-600 mb-3 text-center">
                🎨 Escolha uma cor para marcar
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CORES).map(([cor, config]) => (
                  <Button
                    key={cor}
                    onClick={() => marcarArtigo(cor)}
                    className={`${config.bg} hover:opacity-80 text-white text-xs h-8 w-20 flex items-center justify-center gap-1`}
                    title={config.label}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                    {config.label}
                  </Button>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarCoresFlutantes(false)}
                  className="w-full text-xs text-gray-500"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Modal de Gerenciamento de Tags */}
        {mostrarGerenciadorTags && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setMostrarGerenciadorTags(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>🏷️ Gerenciar Tags</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarGerenciadorTags(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie suas tags personalizadas para categorizar artigos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Formulário de Nova Tag */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">➕ Criar Nova Tag</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Nome da Tag</label>
                        <Input
                          value={novaTag}
                          onChange={(e) => setNovaTag(e.target.value)}
                          placeholder="Ex: Importante, Revisar..."
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Categoria</label>
                        <Select value={categoriaNovaTag} onValueChange={(value) => setCategoriaNovaTag(value as 'juridica' | 'procedural' | 'temporal' | 'personalizada')}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="juridica">📚 Jurídica</SelectItem>
                            <SelectItem value="procedural">⚖️ Procedural</SelectItem>
                            <SelectItem value="temporal">⏰ Temporal</SelectItem>
                            <SelectItem value="personalizada">🎯 Personalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Cor</label>
                        <input
                          type="color"
                          value={corNovaTag}
                          onChange={(e) => setCorNovaTag(e.target.value)}
                          className="w-full h-8 rounded border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Descrição</label>
                        <Input
                          value={descricaoNovaTag}
                          onChange={(e) => setDescricaoNovaTag(e.target.value)}
                          placeholder="Descrição opcional..."
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button onClick={criarNovaTag} size="sm" className="bg-green-600 hover:bg-green-700">
                        Criar Tag
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Tags Existentes */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">📋 Tags Existentes</h3>
                    {vademecum.tagsPersonalizadas.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <div className="text-4xl mb-2">🏷️</div>
                        <p className="text-sm">Nenhuma tag criada ainda</p>
                        <p className="text-xs">Crie sua primeira tag acima</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {vademecum.tagsPersonalizadas.map(tag => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: tag.cor }}
                              />
                              <div>
                                <div className="font-medium text-sm">{tag.nome}</div>
                                <div className="text-xs text-gray-500">
                                  {tag.categoria} • {tag.descricao || 'Sem descrição'}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerTag(tag.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
