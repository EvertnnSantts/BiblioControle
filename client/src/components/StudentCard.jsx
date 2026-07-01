import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * StudentCard - Carteira digital do aluno com código de barras
 * Props:
 *   user: { nome, matricula, curso, turma, email, telefone, createdAt }
 *   loans: array de empréstimos do aluno
 *   onClose: função para fechar/voltar
 *   printable: se true, mostra versão para impressão
 */
const StudentCard = ({ user, loans = [], onClose, printable = false }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && user?.matricula) {
      try {
        JsBarcode(barcodeRef.current, `USR-${user.matricula}`, {
          format: 'CODE128',
          width: 2,
          height: 55,
          displayValue: true,
          text: `USR-${user.matricula}`,
          fontSize: 12,
          margin: 8,
          background: '#ffffff',
          lineColor: '#1e293b'
        });
      } catch (e) {
        console.error('Erro ao gerar código de barras:', e);
      }
    }
  }, [user?.matricula]);

  if (!user) return null;

  const emprestimosAtivos = loans.filter(l => l.status === 'ativo');
  const historicoLoans = loans.filter(l => l.status !== 'ativo').slice(0, 5);

  const statusColor = (status) => {
    switch (status) {
      case 'ativo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'devolvido': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'atrasado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'devolvido': return 'Devolvido';
      case 'atrasado': return 'Atrasado';
      default: return status;
    }
  };

  return (
    <div className={`student-card-wrapper ${printable ? 'print-mode' : ''}`}>
      {/* Cartão */}
      <div className="student-card">
        {/* Cabeçalho Azul */}
        <div className="card-header">
          <div className="card-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          </div>
          <div className="card-title">
            <h2>BiblioControle</h2>
            <p>Carteira de Leitor</p>
          </div>
          <div className="card-status-pill">
            {user.ativo !== false ? '✓ Ativo' : '✗ Inativo'}
          </div>
        </div>

        {/* Avatar e Info */}
        <div className="card-body">
          <div className="card-avatar">
            {user.nome?.charAt(0).toUpperCase()}
          </div>
          <div className="card-info">
            <h3 className="card-name">{user.nome}</h3>
            <p className="card-detail"><strong>Matrícula:</strong> {user.matricula}</p>
            <p className="card-detail"><strong>Curso:</strong> {user.curso}</p>
            {user.turma && <p className="card-detail"><strong>Turma:</strong> {user.turma}</p>}
            {user.email && <p className="card-detail"><strong>Email:</strong> {user.email}</p>}
          </div>
        </div>

        {/* Código de Barras */}
        <div className="card-barcode-section">
          <svg ref={barcodeRef} className="card-barcode"></svg>
        </div>

        {/* Rodapé */}
        <div className="card-footer">
          <span>Biblioteca Escolar</span>
          <span>·</span>
          <span>Válido enquanto matriculado</span>
        </div>
      </div>

      {/* Ações */}
      {!printable && (
        <div className="card-actions">
          <button
            onClick={() => window.print()}
            className="btn-print"
          >
            🖨️ Imprimir Carteira
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-back">
              ← Voltar
            </button>
          )}
        </div>
      )}

      {/* Empréstimos Ativos */}
      {!printable && emprestimosAtivos.length > 0 && (
        <div className="card-loans-section">
          <h4>📚 Empréstimos Ativos ({emprestimosAtivos.length})</h4>
          <div className="loans-list">
            {emprestimosAtivos.map(loan => (
              <div key={loan.id} className="loan-item">
                <div className="loan-info">
                  <span className="loan-title">{loan.book?.titulo || `Livro #${loan.bookId}`}</span>
                  <span className="loan-author">{loan.book?.autor}</span>
                </div>
                <div className="loan-meta">
                  <span className={`loan-status ${statusColor(loan.status)}`}>
                    {statusLabel(loan.status)}
                  </span>
                  <span className="loan-date">
                    Devolução: {loan.dataPrevista ? new Date(loan.dataPrevista).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {!printable && historicoLoans.length > 0 && (
        <div className="card-history-section">
          <h4>🕐 Histórico Recente</h4>
          <div className="loans-list">
            {historicoLoans.map(loan => (
              <div key={loan.id} className="loan-item muted">
                <div className="loan-info">
                  <span className="loan-title">{loan.book?.titulo || `Livro #${loan.bookId}`}</span>
                </div>
                <div className="loan-meta">
                  <span className={`loan-status ${statusColor(loan.status)}`}>
                    {statusLabel(loan.status)}
                  </span>
                  <span className="loan-date">
                    {loan.dataEmprestimo ? new Date(loan.dataEmprestimo).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .student-card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 20px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .student-card {
          width: 340px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          background: white;
          border: 1px solid #e2e8f0;
        }

        .card-header {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .card-logo {
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-logo svg {
          width: 20px;
          height: 20px;
        }

        .card-title h2 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        .card-title p {
          font-size: 11px;
          opacity: 0.8;
          margin: 2px 0 0;
        }

        .card-status-pill {
          margin-left: auto;
          background: rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .card-body {
          padding: 16px 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: #f8fafc;
        }

        .card-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-detail {
          font-size: 12px;
          color: #475569;
          margin: 2px 0;
        }

        .card-detail strong {
          color: #1e293b;
          font-weight: 600;
        }

        .card-barcode-section {
          padding: 12px 20px 8px;
          background: white;
          display: flex;
          justify-content: center;
          border-top: 1px solid #e2e8f0;
        }

        .card-barcode {
          max-width: 100%;
        }

        .card-footer {
          background: #f1f5f9;
          padding: 8px 20px;
          display: flex;
          gap: 6px;
          justify-content: center;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }

        /* Ações abaixo do cartão */
        .card-actions {
          display: flex;
          gap: 10px;
        }

        .btn-print {
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }

        .btn-print:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59,130,246,0.4);
        }

        .btn-back {
          background: white;
          color: #475569;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .btn-back:hover {
          border-color: #94a3b8;
          color: #1e293b;
        }

        /* Seções de empréstimos */
        .card-loans-section,
        .card-history-section {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 14px;
          padding: 16px 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          border: 1px solid #e2e8f0;
        }

        .card-loans-section h4,
        .card-history-section h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px;
        }

        .loans-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .loan-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          gap: 10px;
        }

        .loan-item.muted {
          opacity: 0.75;
        }

        .loan-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .loan-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }

        .loan-author {
          font-size: 11px;
          color: #64748b;
        }

        .loan-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .loan-status {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid;
        }

        .loan-date {
          font-size: 10px;
          color: #94a3b8;
        }

        /* Print */
        @media print {
          .card-actions,
          .card-loans-section,
          .card-history-section {
            display: none !important;
          }
          .student-card-wrapper {
            padding: 0;
          }
          .student-card {
            box-shadow: none;
            border: 2px solid #1e40af;
            width: 320px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentCard;
