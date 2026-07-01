import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { bookService, userService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Search, Printer, Tags, Users, BookOpen } from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Sub-component: Etiqueta Individual para impressão
// ────────────────────────────────────────────────────────────
const BarcodeLabel = ({ value, title, subtitle, type }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.8,
          height: 40,
          displayValue: true,
          text: value,
          fontSize: 9,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (e) {
        console.error('Erro ao gerar código de barras:', e);
      }
    }
  }, [value]);

  return (
    <div className="barcode-label">
      <div className="label-type">{type === 'book' ? '📚' : '👤'}</div>
      <div className="label-title">{title}</div>
      {subtitle && <div className="label-subtitle">{subtitle}</div>}
      <svg ref={svgRef} className="label-barcode" />
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Página Principal: BarcodeAdmin
// ────────────────────────────────────────────────────────────
const BarcodeAdmin = () => {
  const { success, error } = useToast();

  const [tab, setTab] = useState('books'); // 'books' | 'users'
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [labelsPerRow, setLabelsPerRow] = useState(3);

  const fetchItems = async (query = '') => {
    setLoading(true);
    try {
      if (tab === 'books') {
        const res = await bookService.getAll({ search: query, limit: 50 });
        setItems(res.data.data.books || []);
      } else {
        const res = await userService.getAll({ search: query, limit: 50 });
        setItems(res.data.data.users || []);
      }
    } catch (err) {
      error('Erro ao buscar registros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
    setItems([]);
    setSearch('');
  }, [tab]);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(search), 400);
    return () => clearTimeout(timer);
  }, [search, tab]);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const selectedItems = items.filter(i => selectedIds.includes(i.id));

  const handlePrint = () => {
    if (selectedItems.length === 0) {
      error('Selecione pelo menos um item para imprimir.');
      return;
    }
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tags className="w-6 h-6 text-blue-600" />
            Gerador de Etiquetas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecione livros ou alunos para imprimir etiquetas com código de barras.
          </p>
        </div>
        <Button
          onClick={handlePrint}
          disabled={selectedItems.length === 0}
          className="flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
        </Button>
      </div>

      {/* Abas */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'books', label: 'Livros', icon: BookOpen },
          { key: 'users', label: 'Alunos', icon: Users }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de seleção */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Input
                placeholder={`Buscar ${tab === 'books' ? 'livros' : 'alunos'}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                icon={Search}
                className="flex-1"
              />
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:underline whitespace-nowrap font-medium"
              >
                {selectedIds.length === items.length && items.length > 0
                  ? 'Desselecionar tudo'
                  : 'Selecionar tudo'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Tags className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum resultado encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[460px] overflow-auto rounded-lg border border-gray-100">
                {items.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const barcodeValue = tab === 'books'
                    ? (item.codigoBarras || `LIV-${item.id}`)
                    : `USR-${item.matricula}`;
                  const title = tab === 'books' ? item.titulo : item.nome;
                  const subtitle = tab === 'books' ? item.autor : item.matricula;

                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{title}</div>
                        <div className="text-xs text-gray-500">{subtitle} · <span className="font-mono">{barcodeValue}</span></div>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        tab === 'books'
                          ? item.situacao === 'disponivel' ? 'bg-green-100 text-green-700'
                          : item.situacao === 'reservado' ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                          : item.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tab === 'books' ? item.situacao : (item.ativo !== false ? 'Ativo' : 'Inativo')}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Preview e configurações */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Configurações</h3>
            <Select
              label="Etiquetas por linha"
              options={[
                { value: '2', label: '2 por linha' },
                { value: '3', label: '3 por linha' },
                { value: '4', label: '4 por linha' }
              ]}
              value={String(labelsPerRow)}
              onChange={e => setLabelsPerRow(Number(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-3">
              <strong>{selectedItems.length}</strong> etiqueta(s) selecionada(s)
            </p>
          </Card>

          {selectedItems.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Pré-visualização</h3>
              <div className="preview-grid" style={{ '--cols': labelsPerRow }}>
                {selectedItems.slice(0, 6).map(item => {
                  const barcodeValue = tab === 'books'
                    ? (item.codigoBarras || `LIV-${item.id}`)
                    : `USR-${item.matricula}`;
                  return (
                    <BarcodeLabel
                      key={item.id}
                      value={barcodeValue}
                      title={tab === 'books' ? item.titulo : item.nome}
                      subtitle={tab === 'books' ? item.autor : item.matricula}
                      type={tab === 'books' ? 'book' : 'user'}
                    />
                  );
                })}
                {selectedItems.length > 6 && (
                  <div className="text-xs text-center text-gray-400 col-span-full">
                    +{selectedItems.length - 6} mais na impressão
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Área de impressão (oculta na tela, visível no print) */}
      <div className="print-area" style={{ '--print-cols': labelsPerRow }}>
        <div className="print-header">
          <strong>BiblioControle</strong> — Etiquetas de Código de Barras
        </div>
        <div className="print-labels-grid">
          {selectedItems.map(item => {
            const barcodeValue = tab === 'books'
              ? (item.codigoBarras || `LIV-${item.id}`)
              : `USR-${item.matricula}`;
            return (
              <BarcodeLabel
                key={item.id}
                value={barcodeValue}
                title={tab === 'books' ? item.titulo : item.nome}
                subtitle={tab === 'books' ? item.autor : item.matricula}
                type={tab === 'books' ? 'book' : 'user'}
              />
            );
          })}
        </div>
      </div>

      <style>{`
        .barcode-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 6px 6px;
          border: 1.5px dashed #cbd5e1;
          border-radius: 6px;
          background: white;
          min-width: 0;
          gap: 2px;
        }
        .label-type {
          font-size: 14px;
        }
        .label-title {
          font-size: 9px;
          font-weight: 700;
          text-align: center;
          color: #1e293b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        .label-subtitle {
          font-size: 8px;
          color: #64748b;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        .label-barcode {
          max-width: 100%;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(var(--cols, 3), 1fr);
          gap: 8px;
        }

        /* Área de impressão — oculta na tela */
        .print-area {
          display: none;
        }

        @media print {
          /* Oculta tudo exceto a área de impressão */
          body > * {
            display: none !important;
          }
          .print-area {
            display: block !important;
            padding: 10mm;
          }
          .print-header {
            font-size: 11pt;
            margin-bottom: 6mm;
            text-align: center;
            border-bottom: 1px solid #333;
            padding-bottom: 4mm;
          }
          .print-labels-grid {
            display: grid;
            grid-template-columns: repeat(var(--print-cols, 3), 1fr);
            gap: 4mm;
          }
          .barcode-label {
            border: 1px solid #000;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default BarcodeAdmin;
