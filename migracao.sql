-- Migração para BiblioControle
-- Execute este arquivo no seu banco de dados MySQL

-- Adicionar coluna turma na tabela users
ALTER TABLE users ADD COLUMN turma VARCHAR(50);

-- Adicionar coluna quantidadeDisponivel na tabela books
ALTER TABLE books ADD COLUMN quantidadeDisponivel INTEGER DEFAULT 1;

-- Atualizar livros existentes para ter quantidadeDisponivel = quantidade
UPDATE books SET quantidadeDisponivel = quantidade WHERE quantidadeDisponivel IS NULL OR quantidadeDisponivel < 0;