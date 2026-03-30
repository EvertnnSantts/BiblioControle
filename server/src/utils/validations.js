const Joi = require('joi');

// Schema para login de admin
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  })
});

// Schema para criação de admin
const createAdminSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  }),
  nome: Joi.string().max(100).optional()
});

// Schema para criação de usuário
const createUserSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 3 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Senha deve ter pelo menos 6 caracteres',
    'any.required': 'Senha é obrigatória'
  }),
  telefone: Joi.string().min(10).max(20).required().messages({
    'string.min': 'Telefone inválido',
    'string.max': 'Telefone muito longo',
    'any.required': 'Telefone é obrigatório'
  }),
  endereco: Joi.string().min(5).max(255).required().messages({
    'string.min': 'Endereço deve ter pelo menos 5 caracteres',
    'string.max': 'Endereço deve ter no máximo 255 caracteres',
    'any.required': 'Endereço é obrigatório'
  }),
  matricula: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Matrícula deve ter pelo menos 3 caracteres',
    'string.max': 'Matrícula deve ter no máximo 50 caracteres',
    'any.required': 'Matrícula é obrigatória'
  }),
  curso: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Curso deve ter pelo menos 2 caracteres',
    'string.max': 'Curso deve ter no máximo 100 caracteres',
    'any.required': 'Curso é obrigatório'
  }),
  turma: Joi.string().max(50).optional()
});

// Schema para atualização de usuário
const updateUserSchema = Joi.object({
  nome: Joi.string().min(3).max(100).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  telefone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).optional(),
  endereco: Joi.string().min(5).max(255).optional(),
  matricula: Joi.string().min(3).max(50).optional(),
  curso: Joi.string().min(2).max(100).optional(),
  ativo: Joi.boolean().optional()
});

// Schema para criação de livro
const createBookSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Título é obrigatório',
    'string.max': 'Título deve ter no máximo 255 caracteres',
    'any.required': 'Título é obrigatório'
  }),
  autor: Joi.string().min(1).max(255).required().messages({
    'string.min': 'Autor é obrigatório',
    'string.max': 'Autor deve ter no máximo 255 caracteres',
    'any.required': 'Autor é obrigatório'
  }),
  quantidade: Joi.number().integer().min(0).default(1).messages({
    'number.min': 'Quantidade não pode ser negativa'
  }),
  estante: Joi.string().max(50).optional(),
  observacao: Joi.string().max(500).optional(),
  // Removido 'emprestimo' - situação controlada automaticamente
  situacao: Joi.string().valid('disponivel', 'consulta', 'reservado').default('disponivel'),
  genero: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Gênero é obrigatório',
    'string.max': 'Gênero deve ter no máximo 100 caracteres',
    'any.required': 'Gênero é obrigatório'
  })
});

// Schema para atualização de livro
const updateBookSchema = Joi.object({
  titulo: Joi.string().min(1).max(255).optional(),
  autor: Joi.string().min(1).max(255).optional(),
  quantidade: Joi.number().integer().min(0).optional(),
  estante: Joi.string().max(50).optional(),
  observacao: Joi.string().max(500).optional(),
  situacao: Joi.string().valid('disponivel', 'consulta', 'reservado').optional(),
  genero: Joi.string().min(1).max(100).optional()
});

// Schema para empréstimo
const createLoanSchema = Joi.object({
  bookId: Joi.number().integer().positive().required().messages({
    'number.positive': 'ID do livro deve ser positivo',
    'any.required': 'ID do livro é obrigatório'
  }),
  userId: Joi.number().integer().positive().required().messages({
    'number.positive': 'ID do usuário deve ser positivo',
    'any.required': 'ID do usuário é obrigatório'
  }),
  dataPrevista: Joi.date().iso().required().messages({
    'date.base': 'Data prevista inválida',
    'any.required': 'Data prevista é obrigatória'
  }),
  turma: Joi.string().max(50).optional(),
  observacao: Joi.string().max(500).optional()
});

// Schema para devolução
const returnLoanSchema = Joi.object({
  observacao: Joi.string().max(500).optional()
});

// Schema para bloqueio de usuário
const blockUserSchema = Joi.object({
  motivo: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Motivo é obrigatório',
    'string.max': 'Motivo deve ter no máximo 500 caracteres',
    'any.required': 'Motivo é obrigatório'
  })
});

module.exports = {
  loginSchema,
  createAdminSchema,
  createUserSchema,
  updateUserSchema,
  createBookSchema,
  updateBookSchema,
  createLoanSchema,
  returnLoanSchema,
  blockUserSchema
};