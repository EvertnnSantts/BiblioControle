import { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, Ban } from 'lucide-react';

const Users = () => {
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [curso, setCurso] = useState('');
  const [cursos, setCursos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    telefone: '',
    endereco: '',
    matricula: '',
    curso: ''
  });

  const fetchUsers = async () => {
    try {
      const params = { search, curso: curso || undefined };
      const response = await userService.getAll(params);
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCursos = async () => {
    try {
      const response = await userService.getCursos();
      setCursos(response.data.data.cursos);
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCursos();
  }, [search, curso]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...dataWithoutPassword } = formData;
        await userService.update(editingUser.id, password ? formData : dataWithoutPassword);
        success('Usuário atualizado com sucesso!');
      } else {
        await userService.create(formData);
        success('Aluno cadastrado com sucesso!');
      }
      setModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      error(err.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      password: '',
      telefone: user.telefone,
      endereco: user.endereco,
      matricula: user.matricula,
      curso: user.curso
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await userService.delete(id);
        success('Usuário excluído com sucesso!');
        fetchUsers();
      } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        error(err.response?.data?.message || 'Erro ao excluir usuário');
      }
    }
  };

  const handleBlock = async (id) => {
    const motivo = window.prompt('Qual o motivo do bloqueio?');
    if (motivo) {
      try {
        await userService.block(id, { motivo });
        success('Usuário bloqueado com sucesso!');
        fetchUsers();
      } catch (err) {
        console.error('Erro ao bloquear usuário:', err);
        error(err.response?.data?.message || 'Erro ao bloquear usuário');
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      password: '',
      telefone: '',
      endereco: '',
      matricula: '',
      curso: ''
    });
  };

  const columns = [
    { header: 'Nome', accessor: 'nome' },
    { header: 'Email', accessor: 'email' },
    { header: 'Telefone', accessor: 'telefone' },
    { header: 'Curso', accessor: 'curso' },
    { header: 'Matrícula', accessor: 'matricula' },
    { header: 'Status', accessor: 'ativo', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {row.ativo ? 'Ativo' : 'Inativo'}
      </span>
    )},
    { header: 'Ações', width: '150px', render: (row) => (
      <div className="flex gap-1">
        <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => handleBlock(row.id)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Bloquear">
          <Ban className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Excluir">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  const cursoOptions = [
    { value: '', label: 'Todos os cursos' },
    ...cursos.map(c => ({ value: c, label: c }))
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome, email ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <Select
            options={cursoOptions}
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table columns={columns} data={users} emptyMessage="Nenhum usuário encontrado" />
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
            />
          </div>
          <Input
            label="Endereço"
            value={formData.endereco}
            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Matrícula"
              value={formData.matricula}
              onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
              required
            />
            <Input
              label="Curso"
              value={formData.curso}
              onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;