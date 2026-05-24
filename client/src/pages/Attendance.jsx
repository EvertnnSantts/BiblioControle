import { useState, useEffect } from 'react';
import { attendanceService, userService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Plus, Search, User, LogIn, LogOut, ArrowLeft, Download, CheckCircle } from 'lucide-react';

const Attendance = () => {
  const { success, error } = useToast();
  
  // Estados principais
  const [view, setView] = useState('lists'); // 'lists' | 'details'
  const [lists, setLists] = useState([]);
  const [currentList, setCurrentList] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros das listas
  const [filterData, setFilterData] = useState('');
  const [filterTurno, setFilterTurno] = useState('');

  // Modais
  const [modalNewList, setModalNewList] = useState(false);
  const [modalEntry, setModalEntry] = useState(false);
  const [modalExit, setModalExit] = useState(false);
  const [modalCode, setModalCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Busca de usuários
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Formulários
  const [newListData, setNewListData] = useState({ nome: '', data: '', turno: 'Manhã' });
  const [exitData, setExitData] = useState({ codigoSaida: '' });
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  useEffect(() => {
    if (view === 'lists') {
      fetchLists();
    } else if (view === 'details' && currentList) {
      fetchListDetails(currentList.id);
    }
  }, [view, filterData, filterTurno]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterData) params.data = filterData;
      if (filterTurno) params.turno = filterTurno;
      const res = await attendanceService.getLists(params);
      setLists(res.data.data.lists);
    } catch (err) {
      console.error('Erro ao buscar listas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchListDetails = async (id) => {
    try {
      setLoading(true);
      const res = await attendanceService.getListById(id);
      setCurrentList(res.data.data.list);
    } catch (err) {
      console.error('Erro ao buscar detalhes da lista:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const response = await userService.search(query);
      setUserResults(response.data.data.users);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setUserSearch(`${user.nome} (${user.matricula})`);
    setUserResults([]);
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.createList(newListData);
      success('Lista criada com sucesso!');
      setModalNewList(false);
      setNewListData({ nome: '', data: '', turno: 'Manhã' });
      fetchLists();
    } catch (err) {
      error(err.response?.data?.message || 'Erro ao criar lista');
    }
  };

  const handleRegisterEntry = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await attendanceService.registerEntry({
        attendanceListId: currentList.id,
        userId: selectedUser.id
      });
      setGeneratedCode(res.data.data.codigoSaida);
      setModalEntry(false);
      setModalCode(true); // Exibe código para o aluno anotar
      setSelectedUser(null);
      setUserSearch('');
      fetchListDetails(currentList.id);
    } catch (err) {
      error(err.response?.data?.message || 'Erro ao registrar entrada');
    }
  };

  const handleRegisterExit = async (e) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    try {
      await attendanceService.registerExit(selectedRecordId, exitData);
      success('Saída registrada com sucesso!');
      setModalExit(false);
      setExitData({ codigoSaida: '' });
      fetchListDetails(currentList.id);
    } catch (err) {
      error(err.response?.data?.message || 'Erro ao registrar saída. Verifique o código.');
    }
  };

  const handleAdminExit = async (id) => {
    if (window.confirm('Tem certeza que deseja confirmar a saída manualmente sem o código do aluno?')) {
      try {
        await attendanceService.adminRegisterExit(id);
        success('Saída manual registrada com sucesso!');
        fetchListDetails(currentList.id);
      } catch (err) {
        error(err.response?.data?.message || 'Erro ao registrar saída manual');
      }
    }
  };

  const handleDeleteList = async (id) => {
    if (window.confirm('Excluir esta lista apagará todos os registros de entrada e saída. Tem certeza?')) {
      try {
        await attendanceService.deleteList(id);
        success('Lista excluída.');
        fetchLists();
      } catch (err) {
        error('Erro ao excluir lista.');
      }
    }
  };

  const exportCSV = () => {
    if (!currentList || !currentList.records) return;
    
    const headers = ['Nome', 'Matrícula', 'Turma', 'Data', 'Turno', 'Entrada', 'Saída', 'Status'];
    const rows = currentList.records.map(r => [
      r.user.nome,
      r.user.matricula,
      r.user.turma || '-',
      new Date(currentList.data).toLocaleDateString(),
      currentList.turno,
      new Date(r.horarioEntrada).toLocaleTimeString(),
      r.horarioSaida ? new Date(r.horarioSaida).toLocaleTimeString() : '-',
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lista_presenca_${currentList.data}_${currentList.turno}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderização das Visões
  if (view === 'details' && currentList) {
    const columns = [
      { header: 'Aluno', accessor: 'user.nome' },
      { header: 'Matrícula', accessor: 'user.matricula' },
      { header: 'Turma', accessor: 'user.turma' },
      { header: 'Entrada', render: (row) => new Date(row.horarioEntrada).toLocaleTimeString() },
      { header: 'Saída', render: (row) => row.horarioSaida ? new Date(row.horarioSaida).toLocaleTimeString() : '-' },
      { header: 'Status', render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'presente' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status === 'presente' ? 'Presente' : 'Pendente'}
        </span>
      )},
      { header: 'Ações', render: (row) => (
        <div className="flex gap-2">
          {row.status === 'pendente' && (
            <>
              <button 
                onClick={() => { setSelectedRecordId(row.id); setModalExit(true); }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                title="Saída do Aluno"
              >
                Registrar Saída
              </button>
              <button 
                onClick={() => handleAdminExit(row.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                title="Admin: Forçar saída se perdeu o código"
              >
                Saída Manual
              </button>
            </>
          )}
        </div>
      )}
    ];

    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView('lists')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{currentList.nome}</h1>
        </div>

        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Data: {new Date(currentList.data).toLocaleDateString()} | Turno: {currentList.turno}</p>
              <p className="text-sm text-gray-500">Total de Presenças: {currentList.records?.length || 0}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setModalEntry(true)} variant="primary">
                <LogIn className="w-4 h-4 mr-2" />
                Registrar Entrada
              </Button>
              <Button onClick={exportCSV} variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table columns={columns} data={currentList.records || []} emptyMessage="Nenhum aluno registrado." />
          )}
        </Card>

        {/* Modal: Registrar Entrada */}
        <Modal isOpen={modalEntry} onClose={() => setModalEntry(false)} title="Registrar Entrada">
          <form onSubmit={handleRegisterEntry} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Aluno</label>
              <div className="relative">
                <Input
                  placeholder="Nome, matrícula, email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setSelectedUser(null);
                    searchUsers(e.target.value);
                  }}
                  icon={Search}
                />
              </div>
              {userResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {userResults.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{user.nome}</div>
                        <div className="text-sm text-gray-500">Matrícula: {user.matricula}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" disabled={!selectedUser} className="w-full mt-4">
              Confirmar Entrada
            </Button>
          </form>
        </Modal>

        {/* Modal: Registrar Saída (Aluno) */}
        <Modal isOpen={modalExit} onClose={() => setModalExit(false)} title="Registrar Saída">
          <form onSubmit={handleRegisterExit} className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">Informe o código que foi gerado no momento da entrada para confirmar a saída.</p>
            <Input
              label="Código de Saída"
              placeholder="Ex: A7B9X"
              value={exitData.codigoSaida}
              onChange={(e) => setExitData({ codigoSaida: e.target.value.toUpperCase() })}
              required
            />
            <Button type="submit" className="w-full mt-4">Confirmar Saída</Button>
          </form>
        </Modal>

        {/* Modal: Exibir Código Gerado */}
        <Modal isOpen={modalCode} onClose={() => setModalCode(false)} title="Entrada Registrada!">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Anote seu código:</h2>
            <div className="text-4xl font-mono font-bold text-blue-600 tracking-widest bg-blue-50 py-4 rounded-lg border border-blue-200 mb-4">
              {generatedCode}
            </div>
            <p className="text-red-600 font-medium text-sm">
              Anote seu código em um caderno ou tire uma foto. Ele será necessário para registrar sua saída.
            </p>
            <Button onClick={() => setModalCode(false)} className="mt-6 w-full">Entendi</Button>
          </div>
        </Modal>
      </div>
    );
  }

  // View: Lists
  const listColumns = [
    { header: 'Nome da Lista', accessor: 'nome' },
    { header: 'Data', render: (row) => new Date(row.data).toLocaleDateString() },
    { header: 'Turno', accessor: 'turno' },
    { header: 'Ações', render: (row) => (
      <div className="flex items-center gap-3">
        <button onClick={() => { setCurrentList(row); setView('details'); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Abrir</button>
        <button onClick={() => handleDeleteList(row.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Excluir</button>
      </div>
    )}
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Listas de Presença</h1>
        <Button onClick={() => setModalNewList(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Lista
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex gap-4">
          <Input 
            type="date" 
            label="Filtrar por Data" 
            value={filterData} 
            onChange={(e) => setFilterData(e.target.value)} 
          />
          <Select
            label="Turno"
            options={[{value:'', label:'Todos'}, {value:'Manhã', label:'Manhã'}, {value:'Tarde', label:'Tarde'}, {value:'Noite', label:'Noite'}]}
            value={filterTurno}
            onChange={(e) => setFilterTurno(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table columns={listColumns} data={lists} emptyMessage="Nenhuma lista encontrada." />
        )}
      </Card>

      {/* Modal Nova Lista */}
      <Modal isOpen={modalNewList} onClose={() => setModalNewList(false)} title="Nova Lista de Presença">
        <form onSubmit={handleCreateList} className="space-y-4">
          <Input
            label="Nome da Lista"
            placeholder="Ex: Lista de Presença - Dia 22 Turno Noite"
            value={newListData.nome}
            onChange={(e) => setNewListData({ ...newListData, nome: e.target.value })}
            required
          />
          <Input
            type="date"
            label="Data"
            value={newListData.data}
            onChange={(e) => setNewListData({ ...newListData, data: e.target.value })}
            required
          />
          <Select
            label="Turno"
            options={[{value:'Manhã', label:'Manhã'}, {value:'Tarde', label:'Tarde'}, {value:'Noite', label:'Noite'}]}
            value={newListData.turno}
            onChange={(e) => setNewListData({ ...newListData, turno: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalNewList(false)}>Cancelar</Button>
            <Button type="submit">Criar Lista</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;
